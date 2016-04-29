console.log('background.js')
var reload = chrome.runtime.reload
var MAINWIN = 'mainWindow2'
var _update_available = false
// the browser extension that adds a context menu
var extensionId = "bnceafpojmnimbnhamaeedgomdcgnbjk"
var session = null

/*

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
        console.log('onClosedMainWindow')

        if (_update_available) {
            chrome.runtime.reload()
        }
        
        this.mainWindow = null

        chrome.notifications.getAll( function(nots) {
            for (var key in nots) {
                chrome.notifications.clear(key)
            }
        })
        var opts = chrome.app.window.get('options')
        if (opts) { opts.close() }
        var help = chrome.app.window.get('help')
        if (help) { help.close() }
        
        if (window.mediaPort) {
            console.log('disconnecting media port')
            // send notification to media page that it's about to break.
            mediaPort.postMessage({error:"window closed"})
            mediaPort.disconnect()
        }
    }
}
*/

function launch() {
    runtimeEvent({type:'onLaunched', data:{source:'debugger'}})
}

function runtimeEvent(event) {
    if (session) {
        session.registerEvent(event)
    } else {
        session = new jstorrent.Session(event)
    }
}
/*
function onAppLaunchMessage_old(launchData) {
    // launchData, request, sender, sendRepsonse

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
*/
function setup_uninstall() {
    try {
        chrome.runtime.setUninstallURL('http://jstorrent.com/uninstall/?id=' + encodeURIComponent(chrome.runtime.id),
                                       function(result) {
                                           var lasterr = chrome.runtime.lastError
                                           if (lasterr) {
                                               console.warn('set uninstall url with result',result,'lasterr',lasterr)
                                           }
                                       }
                                      )
    } catch(e) {
        console.warn('error setting uninstall url',e)
    }
}

function fetchVersion() {
    var url = 'http://jstorrent.com/data/version.txt'
    function onload(evt) {
        console.log('fetch version response',evt)
        if (evt.target.status == 200) {
            var remoteversion = evt.target.response.trim()
            var curver = chrome.runtime.getManifest().version
            console.log('comparing server version',remoteversion,'to my version',curver)
            if (compareVersion(curver, remoteversion) < 0) {
                doShowUpdateAvailableDEV()
            }
        }
    }
    var xhr = new XMLHttpRequest
    xhr.onload = xhr.ontimeout = xhr.onerror = onload
    xhr.open("GET",url)
    xhr.send()
}
function compareVersion(version1, version2) {
    var a1 = version1.split('.').map(function(s){return parseInt(s)})
    var a2 = version2.split('.').map(function(s){return parseInt(s)})
    var n = Math.max(a1.length,a2.length)
    a1 = a1.concat( new Array(n-a1.length).fill(0) )
    a2 = a2.concat( new Array(n-a2.length).fill(0) )
    for (var i=0; i<n; i++) {
        if (a1[i] > a2[i]) {
            return 1
        } else if (a1[i] < a2[i]) {
            return -1
        }
    }
    return 0
}
function doShowUpdateAvailableDEV(details) {
    var msg = "Your version of " + chrome.i18n.getMessage("extName") + " is older than the one available in the Chrome Web Store. Install it there or manually update."
    chrome.notifications.create('update-available',
                                { title:chrome.i18n.getMessage("extName") + " Version Warning",
                                  type:"basic",
                                  priority:2,
                                  iconUrl: "js-128.png",
                                  message:msg,
                                  buttons:[
                                      {title:"Install", iconUrl:"cws_32.png"},
                                      {title:"Not now"}
                                  ]
                                }, function(id) {
                                    console.log('created notification with id',id,chrome.runtime.lastError)
                                })
    function onButtonClick(id, idx) {
        chrome.notifications.onButtonClicked.removeListener( onButtonClick )
        if (id == 'update-available') {
            if (idx == 0) {
                chrome.browser.openTab( { url: "https://chrome.google.com/webstore/detail/jstorrent/anhdpjpojoipgpmfanmedjghaligalgb" } )
            } else if (idx == 1) {
                // nothing
            }
        }
        chrome.notifications.clear('update-available')
    }
    chrome.notifications.onButtonClicked.addListener( onButtonClick )
}
function doShowUpdateAvailable(details) {
    // even though priority 2 it's not showing up in foreground on CrOS (maybe because created in background page?)
    var msg = "An update is available and will be installed the next time you restart " + chrome.i18n.getMessage("extName")
    chrome.notifications.create('update-available',
                                { title:chrome.i18n.getMessage("extName") + " Update",
                                  type:"basic",
                                  priority:2,
                                  iconUrl: "js-128.png",
                                  message:msg,
                                  buttons:[
                                      {title:"Install Now", iconUrl:"cws_32.png"},
                                      {title:"Later", iconUrl:"cws_32.png"}
                                  ]
                                }, function(id) {
                                    console.log('created notification with id',id,chrome.runtime.lastError)

                                })
    function onButtonClick(id, idx) {
        chrome.notifications.onButtonClicked.removeListener( onButtonClick )
        if (id == 'update-available') {
            if (idx == 0) {
                chrome.runtime.reload()
            }
        }
        chrome.notifications.clear('update-available')
    }
    chrome.notifications.onButtonClicked.addListener( onButtonClick )
}
function doShowUpdateNotification(details, history) {
    var currentVersion = details.cur
    var msg = chrome.i18n.getMessage("extName") + " has updated to version " + currentVersion

    chrome.notifications.create('update-installed',
                                { title:chrome.i18n.getMessage("extName") + " Updated",
                                  type:"basic",
                                  priority:2,
                                  iconUrl: "js-128.png",
                                  message:msg,
                                  buttons:[
                                      {title:"View changes", iconUrl:"cws_32.png"}
                                  ]
                                }, function(id) {
                                    console.log('created notification with id',id,chrome.runtime.lastError)

                                })
    function onButtonClick(id, idx) {
        chrome.notifications.onButtonClicked.removeListener( onButtonClick )
        if (id == 'update-installed') {
            var url = 'http://jstorrent.com/#changeLog'
            chrome.browser.openTab({url:url})
        }
        chrome.notifications.clear('update-installed')
    }
    chrome.notifications.onButtonClicked.addListener( onButtonClick )
}
function checkForUpdateMaybe() {
    function docheck() {
        console.log('check for update')
        chrome.storage.local.set({'lastUpdateCheck':Date.now()})
        if (DEVMODE) {
            fetchVersion()
        } else {
            chrome.runtime.requestUpdateCheck(function(result){
                console.log('update check:', result)
            })
        }
    }
    chrome.storage.local.get('lastUpdateCheck', function(d) {
        var lastcheck = d['lastUpdateCheck']
        var willcheck = false
        if (lastcheck) {
            if (Date.now() - lastcheck > 1000 * 60 * 20) {
                willcheck = true
            }
        } else {
            willcheck = true
        }
        if (willcheck) {
            docheck()
        } else {
            console.log('will not check for update')
        }
    })
}

chrome.runtime.onInstalled.addListener(function(details) {
    runtimeEvent({type:'onInstalled',data:details})
    //console.log('onInstalled',details)
    var sk = 'onInstalledInfo'
    chrome.storage.sync.get('sk', function(syncresp) {
    chrome.storage.local.get(sk, function(resp) {
        var showUpdateNotification = false
        //console.log('got previous install info',resp)

        var previous_updates = resp[sk]
        var changed = false
        var most_recent_update = null
        if (previous_updates && previous_updates.length > 0) {
            most_recent_update = previous_updates[previous_updates.length-1]
        }

        details.date = new Date().getTime()
        details.cur = chrome.runtime.getManifest().version

        if (syncresp['sk'] !== undefined) {
            showUpdateNotification = true
            chrome.storage.sync.remove("sk")
        }
        
        if (! previous_updates) {
            console.log('initializing install info')
            resp[sk] = [details]
            changed = true
        } else if (most_recent_update && most_recent_update.cur == details.cur) {
            // previousVersion missing?
        } else if (details.previousVersion == details.cur) {
            // happend because of chrome.runtime.reload probably
        } else {
            console.log('adding new install info',details)
            resp[sk].push(details)
            changed = true
            showUpdateNotification = true
        }

        if (resp[sk].length > 15) {
            // purge really old entries
            changed = true
            resp[sk].splice(0,1)
        }
        if (changed) {
            chrome.storage.local.set(resp, function(){console.log('persisted onInstalled info')})
        }

        if (showUpdateNotification) {
            doShowUpdateNotification(details, resp)
        }
    })
    })
    //details.reason // install, update, chrome_update
    //details.previousVersion // only if update
})

chrome.runtime.onUpdateAvailable.addListener( function(details) {
    // notify that there's a new version? click to restart? nah...
    console.log('a new version is available:',details.version,details)
    _update_available = true
    if (DEVMODE) {
        doShowUpdateAvailableDEV(details)
    } else {
        doShowUpdateAvailable(details)
    }
})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('chrome runtime message',request,sender)
    if (request && request.command == 'openWindow') {
        chrome.browser.openTab({url:request.url})
    }
})

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
        runtimeEvent(info)

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

chrome.runtime.onSuspend.addListener( function(evt) {
    runtimeEvent({type:'onSuspend',data:evt})
    var a = app()
    if (a) {
        a.runtimeMessage('onSuspend')
    }
    console.log('onSuspend',evt)
    // maybe try to stop it?
    // triggerKeepAwake()
})

chrome.runtime.onSuspendCanceled.addListener( function(evt) {
    runtimeEvent({type:'onSuspendCanceled',data:evt})

    var a = app()
    if (a) {
        a.runtimeMessage('onSuspendCanceled')
    }
    console.log('onSuspendCanceled',evt)
})
/* // this will cause the background page to wake up every time it changes. not necessary
if (chrome.idle && chrome.idle.onStateChanged) {
    chrome.idle.onStateChanged.addListener( function(evt) {
        console.log('idle state changed',evt)
    })
}*/

chrome.runtime.onStartup.addListener( function(evt) {
    runtimeEvent({type:'onStartup',data:evt})
    console.log('onStartup',evt)
})

chrome.app.runtime.onLaunched.addListener(function(data) {
    var info = {type:'onLaunched',
                data: data}
    runtimeEvent(info)
});

chrome.app.runtime.onRestarted.addListener( function(evt) {
    runtimeEvent({type:'onRestarted',data:evt})
    console.log('app onRestarted',evt)
})

if (chrome.runtime.setUninstallURL && ! DEVMODE) {
    setup_uninstall()
}
