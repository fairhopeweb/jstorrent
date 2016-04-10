console.log('background page loaded')
var reload = chrome.runtime.reload
// the browser extension that adds a context menu
var extensionId = "bnceafpojmnimbnhamaeedgomdcgnbjk"

function app() {
    if (chrome.app && chrome.app.window.get) {
        var mw = chrome.app.window.get('mainWindow')
        if (mw) {
            if (mw.contentWindow) {
                return mw.contentWindow.app
            }
        }
    }
}

function getMainWindow() {
    return chrome.app.window.get && chrome.app.window.get('mainWindow')
}

function debugSockets() {
    chrome.sockets.tcp.getSockets( function(socketInfos) {
        console.log('current tcp sockets', socketInfos)
    })
    chrome.sockets.udp.getSockets( function(socketInfos) {
        console.log('current udp sockets', socketInfos)
    })
}

function WindowManager() {
    // TODO -- if we add "id" to this, then chrome.app.window.create
    // won't create it twice.  plus, then its size and positioning
    // will be remembered. so put it in.
    this.mainWindowOpts = {
        width: 865,
//        frame: 'none',
            frame:{color:'#1687d0'},
        height: 610,
        resizable: true,
        minHeight: 32,
//        minWidth: 770, // set/get doesnt work yet (dev channel?)
        id: 'mainWindow'
    }

    this.creatingMainWindow = false
    this.createMainWindowCallbacks = []
    this.mainWindow = null
}

WindowManager.prototype = {
    getMainWindow: function(callback) {
        // gets main window or creates if needed
        var _this = this
        if (this.mainWindow) {
            callback(_this.mainWindow)
        } else {
            this.createMainWindow( function() {
                callback(_this.mainWindow)
            })
        }
    },
    createMainWindow: function(callback) {
        if (this.mainWindow) { 
            console.log('not creating main window, it already exists')
            return
        }

        if (this.creatingMainWindow) {
            // this can happen when we select multiple "torrent" files
            // in the files app and launch with JSTorrent.
            this.createMainWindowCallbacks.push(callback)
            return
        }

        var _this = this;
        console.log('creating main window')
        this.creatingMainWindow = true
        var page = 'gui/index.html'
        //var page = 'polymer-ui/index.html'
        chrome.app.window.create(page,
                                 this.mainWindowOpts,
                                 function(mainWindow) {
                                     ensureAlive()
                                     _this.mainWindow = mainWindow
                                     _this.creatingMainWindow = false

                                     mainWindow.onMinimized.addListener( this.onMinimizedMainWindow.bind(this) )
                                     mainWindow.onRestored.addListener( this.onRestoredMainWindow.bind(this) )
                                     
                                     mainWindow.onClosed.addListener( function() {
                                         _this.onClosedMainWindow()
                                     })
                                     callback()

                                     var cb
                                     while (_this.createMainWindowCallbacks.length > 0) {
                                         cb = _this.createMainWindowCallbacks.pop()
                                         cb()
                                     }

                                 }.bind(this)
			        );
    },
    onRestoredMainWindow: function() {
        console.log('main window restored. re-create UI')
        var app = this.mainWindow.contentWindow.app
        app.UI.undestroy()
        // restore the UI
    },
    onMinimizedMainWindow: function() {
        console.log('main window minimized. destroy UI')
        var app = this.mainWindow.contentWindow.app
        app.UI.destroy()
        // destroy the UI completely to free up memory
    },
    onClosedMainWindow: function() {
        var app = this.mainWindow.contentWindow.app

        if (app.options_window) {
            app.options_window.close()
        }
        if (app.help_window) {
            app.help_window.close()
        }
        // app cannot close the notificationts, but we can grab data from it beforehand
        // cannot do anything async on main window javascript context at this point
        for (var key in app.notifications.keyeditems) {
            chrome.notifications.clear(key, function(){})
        }
        this.mainWindow = null
        
        if (window.mediaPort) {
            // send notification to media page that it's about to break.
            mediaPort.postMessage({error:"window closed"})
            mediaPort.disconnect()
        }
    }
}

var windowManager = new WindowManager
// if background page reloads, we lose reference to windowmanager main window...
//window.ctr = 0
function ensureAlive() {
    // attempt to make this page not suspend, because that causes our retained directoryentry to become invalid
    if (! window.ensureAliveTimeout) {
        if (getMainWindow()) { // only when the page is alive
            window.ensureAliveTimeout = setTimeout( function() {
                window.ensureAliveTimeout = null;
                //window.ctr++
                //console.log('ensured alive')
                ensureAlive()
            }, 1000 )
        }
    }
}


chrome.app.runtime.onLaunched.addListener(function(launchData) {
    console.log('onLaunched with launchdata',launchData)
    var info = {type:'onLaunched',
                launchData: launchData}
    onAppLaunchMessage(info)
});

function launch() {
    onAppLaunchMessage({})
}

function onAppLaunchMessage(launchData) {
    // launchData, request, sender, sendRepsonse

//    chrome.app.window.create("dummy.html", function(win) {
//        window.open('gui/index.html')
//        setTimeout(function() {
//            win && win.contentWindow.close()
//        }, 1e3)
//    })

    function onMainWindow(mainWindow) {
        mainWindow.contentWindow.app.registerLaunchData(launchData)
    }
    function onMainWindowSpecial(mainWindow) {
        // the app object has not been initialized
        if (! mainWindow.contentWindow.jstorrent_launchData) {
            mainWindow.contentWindow.jstorrent_launchData = []
        }
        mainWindow.contentWindow.jstorrent_launchData.push( launchData )
    }

    windowManager.getMainWindow( function(mainWindow) {
        // if window already existed...
        if (mainWindow.focus) {
            mainWindow.focus()
        } else {
            // WTF chrome.app.window.get doesnt even exist at this point
            // crash
            chrome.runtime.reload()
        }

        if (mainWindow.contentWindow.app) {
            onMainWindow(mainWindow)
        } else {
            onMainWindowSpecial(mainWindow)
        }
    })


}

var BLOBS = []
function getBlobURL(entry, callback) {
    function onfile(file) {
        console.log('playable file',file)
        var url = (window.URL || window.webkitURL).createObjectURL(file)
        BLOBS.push(url) // when to destroy object url?
        callback(url)
    }
    entry.file(onfile,onfile)
}

if (chrome.runtime.setUninstallURL && ! DEVMODE) {
    setup_uninstall()
}

function setup_uninstall() {
    console.log('setting uninstall URL')
    try {
        chrome.runtime.setUninstallURL('http://jstorrent.com/uninstall/?id=' + encodeURIComponent(chrome.runtime.id),
                                       function(result) {
                                           var lasterr = chrome.runtime.lastError
                                           console.log('set uninstall url with result',result,'lasterr',lasterr)
                                       }
                                      )
    } catch(e) {
        console.error('error setting uninstall url',e)
    }
}

chrome.runtime.onInstalled.addListener(function(details) {
    console.log('onInstalled',details)
    var sk = 'onInstalledInfo'
    chrome.storage.sync.get(sk, function(resp) {
        console.log('got previous install info',resp)

        details.date = new Date().getTime()
        details.cur = chrome.runtime.getManifest().version

        if (! resp[sk]) {
            resp[sk] = [deatails]
        } else if (details.previousVersion == details.cur) {
            // happend because of chrome.runtime.reload probably
        } else {
            resp[sk].push(details)
        }

        if (resp[sk].length > 5) {
            // purge really old entries
            resp[sk].splice(0,1)
        }

        chrome.storage.sync.set(resp, function(){console.log('persisted onInstalled info')})
    })
    
    //details.reason // install, update, chrome_update
    //details.previousVersion // only if update
})

chrome.runtime.onUpdateAvailable.addListener( function(details) {
    // notify that there's a new version? click to restart? nah...
    console.log('a new version is available:',details.version,details)
})

/*
// detect if extension is installed... -- moved to js/app.js
chrome.runtime.sendMessage(extensionId, {running:true}, function(response) {
    console.log('got msg from extension',response, chrome.runtime.lastError)
})
*/

if (chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log('chrome runtime message',request,sender)
        if (request && request.command == 'openWindow') {
            chrome.browser.openTab({url:request.url})
        }
    })
}

if (chrome.runtime.onMessageExternal) {
chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
    console.log('onMessageExternal',request,sender)
    if (request && request.command == 'checkInstalled') {
        sendResponse( {handled:true,
                       installed: true,
                       id: chrome.runtime.id,
                       version: chrome.runtime.getManifest().version})
        return
    } else if (request && request.command == 'add-url') {
        // External messages come from a browser Extension that adds a right click
        // context menu so that this App can handle magnet links.
        var info = {type:'onMessageExternal',
                    request: request,
                    sender: sender,
                    sendResponse: sendResponse}
        onAppLaunchMessage(info)

        sendResponse({ handled: true, 
                       id: chrome.runtime.id, 
                       version: chrome.runtime.getManifest().version
                     })
    } else if (request && request.command == 'getStatus') {
        var resp = { version: chrome.runtime.getManifest().version
                   }
        var a = app()
        if (a && a.webapp) {
            resp.webapp = a.webapp.get_info()
        }
        sendResponse(resp)
    } else {
        sendResponse({ handled: false,
                       id: chrome.runtime.id, 
                       version: chrome.runtime.getManifest().version,
                       message: 'unknown command' })
    }
});
}


if (chrome.runtime.onConnectExternal) {
    chrome.runtime.onConnectExternal.addListener( function(port) {
        var authorized = true
        if (authorized) {
            console.log('received authorized port',port)
            try{
                if (window.mediaPort) {
                    // disconnect the other port
                    mediaPort.postMessage({error:"another port is opening"}) // might already be disconnected.
                    mediaPort.disconnect()
                }
            }catch(e){
                console.warn("port was already disconnected")
            }
            window.mediaPort = port
            port.onMessage.addListener( function(msg) {
                var a = app()
                if (a) {
                    a.client.handleExternalMessage(msg, port)
                } else {
                    port.postMessage({error:"no app"})
                    console.warn('no app, could not handle external message')
                }
            })
            port.onDisconnect.addListener( function(msg) {
                console.log('external ondisconnect',msg)
                window.mediaPort = null
            })
            port.postMessage({text:"OK"})
        } else {
            console.error('unauthorized port',port)
            port.disconnect()
        }
    })
}

chrome.runtime.onStartup.addListener( function(evt) {
    console.log('onStartup',evt)
})
chrome.runtime.onSuspend.addListener( function(evt) {
    var a = app()
    if (a) {
        a.runtimeMessage('onSuspend')
    }
    console.log('onSuspend',evt)
})
chrome.runtime.onSuspendCanceled.addListener( function(evt) {
    var a = app()
    if (a) {
        a.runtimeMessage('onSuspendCanceled')
    }
    console.log('onSuspendCanceled',evt)
})
chrome.app.runtime.onRestarted.addListener( function(evt) {
    console.log('app onRestarted',evt)
})
