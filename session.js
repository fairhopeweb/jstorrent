(function() {
    function Session(event) {
        // load chrome.storage.local settings
        // (maybe resume.dat file from PERSISTENT isolated storage)
        // setup listen for gcm messages if setting wants it.
        this.id = 'app01'
        this.statekey = 'session01.state'
        this.GUID = null
        this.state = null
        this.options = null
        this.oauth = []
        this.permissions = null
        this.notifications = new jstorrent.Notifications
        this.events = []
        this.ready = false
        this.launching = false
        this.eventData = null
        this.wantsUI = false
        this.thinking = null

        this.gcmid = null
        this.gcm_retries = 0

        this.userProfile = null
        this.platformInfo = null
        this.cpuInfo = null
        this.storageInfo = null
        this.memoryInfo = null
        this.networkInterfaces = null
        this.manifest = null

        this.analytics = null
        this.client = false // becomes true and then reference to actual client
        this[MAINWIN] = false
        this.registerEvent(event)
        this.onClientError_ = this.onClientError.bind(this)
        this.onTorrentComplete_ = this.onTorrentComplete.bind(this)
        this.onTorrentProgress_ = this.onTorrentProgress.bind(this)
        this.onTorrentStart_ = this.onTorrentStart.bind(this)
        this.onTorrentStop_ = this.onTorrentStop.bind(this)
        this.onTorrentHaveMetadata_ = this.onTorrentHaveMetadata.bind(this)
        
        runParallel( [ this.getPermissions.bind(this),
                       this.getLastState.bind(this),
                       this.getGUID.bind(this),
                       this.getProfileInfo.bind(this), // needs chrome 37
                       this.getSystemCPUInfo.bind(this),
                       this.getNetworkInterfaces.bind(this),
                       this.getSystemStorageInfo.bind(this),
                       this.getSystemMemoryInfo.bind(this),
                       this.getPlatformInfo.bind(this),
                       this.getOptions.bind(this) ],
                     this.onReady.bind(this))
    }
    SessionProto = {
        getGUID: function(cb) {
            chrome.storage.local.get('GUID', function(result) {
                var guid = result["GUID"]
                if (! guid) {
                    this.GUID = makeguid()
                    chrome.storage.local.set({"GUID":this.GUID})
                } else {
                    this.GUID = guid
                }
                cb()
            }.bind(this))
        },
        getNetworkInterfaces: function(cb) {
            chrome.system.network.getNetworkInterfaces( function(info) {
                this.networkInterfaces = info
                cb()
            }.bind(this))
        },
        getSystemCPUInfo: function(cb) {
            chrome.system.cpu.getInfo( function(info) {
                this.cpuInfo = info
                cb()
            }.bind(this))
        },
        getSystemStorageInfo: function(cb) {
            chrome.system.storage.getInfo( function(info) {
                this.storageInfo = info
                cb()
            }.bind(this))
        },
        getSystemMemoryInfo: function(cb) {
            chrome.system.memory.getInfo( function(info) {
                this.memoryInfo = info
                cb()
            }.bind(this))
        },
        getProfileInfo: function(cb) {
            chrome.identity.getProfileUserInfo( function(info) {
                this.userProfile = info
                cb()
            }.bind(this))
        },
        getPlatformInfo: function(cb) {
            chrome.runtime.getPlatformInfo( function(info) {
                this.platformInfo = info
                cb()
            }.bind(this))
        },
        getLastState: function(cb) {
            chrome.storage.local.get(this.statekey, function(result) {
                this.state = result[this.statekey]
                cb()
            }.bind(this))
        },
        onTorrentComplete: function(evt) {
            console.clog(L.SESSION,'torrent complete',evt)
        },
        onTorrentProgress: function(torrent) {
            //console.clog(L.SESSION,'torrent progress',torrent.get('name'), Math.floor(100 * torrent.get('complete')))
        },
        onClientError: function(evt,e) {
            console.clog(L.SESSION,'on client error',evt,e)
        },
        onTorrentStart: function(torrent) {
            console.clog(L.SESSION,'torrent start',torrent)
        },
        onTorrentStop: function(torrent) {
            console.clog(L.SESSION,'torrent stop',torrent)
        },
        onTorrentHaveMetadata: function(torrent) {
            console.clog(L.SESSION,'torrent has metadata',torrent)
        },
        prettyDeviceName: function() {
            var GBRAM = ( this.memoryInfo.capacity / (Math.pow(1024,3)) ).toFixed(1)
            var CPU = this.cpuInfo.modelName
            var cores = this.cpuInfo.numOfProcessors.toString()
            var OS = this.platformInfo.os
            return [OS,
                    navigator.platform,
                    CPU,
                    cores,
                    GBRAM]
        },
        bindClientEvents: function() {
            this.client.on('error', this.onClientError_)
            this.client.torrents.on('error', this.onClientError_)
            this.client.torrents.on('complete', this.onTorrentComplete_)
            this.client.torrents.on('progress', this.onTorrentProgress_)
            this.client.torrents.on('started', this.onTorrentStart_)
            this.client.torrents.on('havemetadata', this.onTorrentHaveMetadata_)
            this.client.torrents.on('stopped', this.onTorrentStop_)
        },
        debugState: function() {
            return
            return {client:this.client,
                    MAINWIN:this[MAINWIN],
                    analytics:this.analytics,
                    launching:this.launching}
        },
        onWindowClosed: function(id) {
            console.clog(L.SESSION,'window closed',id,this.debugState())
            this[id] = null
            if (id == MAINWIN) {
                var win = chrome.app.window.get(id).contentWindow
                var fgapp = win.fgapp
                // client still has event listeners with fgapp, and they are being sent, but ignored. hm
                this.client.fgapp = null
                var opts = chrome.app.window.get('options')
                if (opts) { opts.close() }
                var help = chrome.app.window.get('help')
                if (help) { help.close() }
            }
        },
        onWindowRestored: function() {
            console.log('main window restored. re-create UI')
            if (this.client && this.client.fgapp && this.client.fgapp.UI) {
                this.client.fgapp.UI.undestroy()
            }
        },
        onWindowMinimized: function() {
            console.log('main window minimized. destroy UI')
            if (this.client && this.client.fgapp && this.client.fgapp.UI) {
                this.client.fgapp.UI.destroy()
            }
        },
        notify: function(msg, prio) {
            console.log('app notify',msg,'prio',prio)
        },
        createNotification: function(opts) {
            console.log('create notification',opts)
        },
        shutdown: function() {
            killAllSockets()
            this.analytics = null
            if (this.client) {
                //this.client.fgapp.cleanup()
                this.client.fgapp = null
            }
            this.client.cleanup()
            this.client = null
            
            var cwin = chrome.app.window.get('client')
            if (cwin) cwin.close()
            var awin = chrome.app.window.get('analytics')
            if (awin) awin.close()
            if (this.thinking) {
                clearInterval(this.thinking)
                this.thinking = null
            }
            var d = {}
            d[this.statekey] = {dontstart_once:true}
            chrome.storage.local.set(d, function() {
                chrome.runtime.reload()
            })
        },
        addListener: function(t,cb) {
            if (! this._listeners[t]) this._listeners[t] = []
            this._listeners[t].push(cb)
        },
        trigger: function(t) {
            var cbs = this._listeners[t]
            if (cbs) cbs.forEach( function(cb){cb()} )
        },
        registerOAuthGrant: function(scopes, token) {
            console.clog(L.SESSION,'got oauth',scopes,token)
            this.oauth.push( { scopes: scopes, token: token } )
            this.registerWithGCMServer()
        },
        tryGetOpenID: function() {
			if (! this.options.get('remote_access')) { return }
            var scopes = ["openid"]
            // would be nice maybe to allow using an account different from the chrome account.
            // (launch web auth flow ...)
            chrome.identity.getAuthToken({scopes:scopes,
                                          interactive:false
                                         },
                                         function(result) {
                                             var lasterr = chrome.runtime.lastError
                                             if (lasterr) {
                                                 console.log('could not get token',lasterr)
                                             } else if (result) {
												 // token can be empty? (maybe user clicks cancel)
                                                 this.registerOAuthGrant(scopes, result)
                                             }
                                         }.bind(this))
        },
        registerWithGCMServerResult: function(evt) {
            console.clog(L.SESSION,'got register result',evt.target.status)
        },
        registerWithGCMServer: function() {
            chrome.gcm.register([jstorrent.gcm_appid], function(gcmid) {
                var lasterr = chrome.runtime.lastError
                if (lasterr) {
                    // try again ?
                    console.log('error registering with gcm',lasterr)
                    this.gcm_retries++
                    if (this.gcm_retries > 3) {
                        console.log('giving up registering with gcm')
                    } else {
                        setTimeout( this.registerWithGCMServer.bind(this), 1000 * Math.pow(this.gcm_retries, 2) )
                    }
                    return
                }
                console.clog(L.SESSION,'registered with gcm',gcmid)
                this.gcmid = gcmid
                var oauth = this.oauth[this.oauth.length - 1]
                var params = {
                    appid: jstorrent.gcm_appid,
                    guid: this.GUID,
                    scopes: oauth.scopes.join(' '),
                    token: oauth.token,
                    version: this.manifest.version,
                    locale: chrome.i18n.getUILanguage(),
                    dev: DEVMODE,
                    device_name: this.options.get('remote_access_device_name'),
                    device: this.prettyDeviceName(),
                    gcmid: gcmid
                }
                var xhr = new XMLHttpRequest
                xhr.timeout = 20000
                xhr.open("POST", jstorrent.gcm_identity_server + '/api/gcm/register')
                xhr.onload = xhr.onerror = xhr.ontimeout = this.registerWithGCMServerResult.bind(this)
                xhr.send(JSON.stringify(params))
            }.bind(this))
        },
        registerEvent: function(event) {
            console.clog(L.SESSION,'register event',event,this.debugState())
            this.events.push(event)
            this.runEvents()
        },
        getPermissions: function(cb) {
            chrome.permissions.getAll( function(permissions) {
                this.permissions = permissions
                cb()
            }.bind(this))
        },
        getOptions: function(cb) {
            this.options = new jstorrent.Options({app:this})
            this.options.load( cb )
        },
        runEvents: function() {
            if (this.ready && ! this.launching && this.events.length > 0) {
                var evt = this.events.shift()
                this.runEvent( evt )
            }
        },
        onReady: function() {
            this.manifest = chrome.runtime.getManifest()
            console.clog(L.SESSION,'ready')
            this.ready = true
            this.analytics = new jstorrent.Analytics({app:this})
            this.tryGetOpenID()
            
            if (this.state && this.state.dontstart_once) {
                if (this.events) { this.events.shift() }
                chrome.storage.local.remove(this.statekey, function() {
                    console.clog(L.SESSION, 'wont start, dontstart_once')
                })
                this.state = null
            } else {
                this.runEvents()
            }
        },
        createClient: function() {
            if (! this.client) {
                this.client = true
                var id = 'client'
                chrome.app.window.create('gui/client.html',
                                         {id:id,
                                          hidden:true},
                                         function(win){
                                             win.onClosed.addListener(this.onWindowClosed.bind(this,id))
                                         }.bind(this))
            } else {
            }
        },
        createAnalytics: function() {
            if (! this.analytics) {
                this.analytics = true
                var id = 'analytics'
                chrome.app.window.create('gui/analytics.html',
                                         {id:id,
                                          hidden:true},
                                         function(win){
                                             win.onClosed.addListener(this.onWindowClosed.bind(this,id))
                                         }.bind(this))
            }
        },
        createUI: function() {
            if (! this[MAINWIN]) {
                var id = MAINWIN
                this[MAINWIN]=true
                var opts ={
                    outerBounds: { width: 865,
                                   height: 610,
                                   minWidth: 780,
                                   minHeight: 200 },
                    frame:{type:'chrome',
                           color:'#2191ed',
                           activeColor:'#2191ed',
                           inactiveColor: '#82c9ff'
                          },
                    resizable: true,
                    id: id
                }
                chrome.app.window.create('gui/ui.html',
                                         opts,
                                         function(win){
                                             win.onMinimized.addListener(this.onWindowMinimized.bind(this,id))
                                             win.onRestored.addListener(this.onWindowRestored.bind(this,id))
                                             win.onClosed.addListener(this.onWindowClosed.bind(this,id))
                                         }.bind(this))
            }
        },
        onClientPageInit: function(win) {
            console.clog(L.SESSION,'client page created client',win.client)
            console.assert(win.client)
            this.client = win.client
            //this.lastclient = win.client // debug how long this reference stays around
            this.bindClientEvents()
            if (this.wantsUI) {
                this.createUI()
            } else {
                this.launchDone()
            }
        },
        onAnalyticsPageInit: function(win) {
            console.clog(L.SESSION,'analytics page ready',win.jsanalytics)
            this.analytics = win.jsanalytics
            this.createClient()
        },
        onUIPageInit: function(win) {
            console.clog(L.SESSION,'UI page ready')
            this[MAINWIN] = true
            this.launchDone()
        },
        launchDone: function() {
            console.clog(L.SESSION,'launchdone',this.eventData)
            this.launching = false
            this.client.handleLaunchData(this.eventData)
            this.eventData = null
            this.runEvents()
        },
        launch: function(data) {
			console.clog(L.SESSION,'launch',data)
            if (! this.thinking) {
                this.thinking = setInterval(this.think.bind(this), 10000)
            }
            if (this.launching) {
                console.warn('call to launch with',data,'but already launching')
                return
            }
            this.launching = true // this is getting stuck
            if (this[MAINWIN]) {
                // have all windows already
                if (data.type != 'gcmMessage') {// only for some types of events
                    chrome.app.window.get(MAINWIN).focus()
                }
                this.launchDone()
            } else if (this.wantsUI && this.analytics && this.client) { // this.client == false even when should be true
                this.createUI()
            } else {
                this.createAnalytics() // made it a separate page because analytics bundle seems to prevent sleep.
            }
        },
        think: function() {
            if (DEVMODE && this.options.get('dont_shutdown')) { return }
            
            // TODO when ui open, stop interval
            var mainwin = chrome.app.window.get(MAINWIN)
            if (this.launching) {
                
            } else if (! mainwin && ! this.options.get('download_in_background')) {
                console.log('shutting down, background mode disabled')
                this.shutdown()
            } else if (this.client && ! this.client.isActive() && ! mainwin) {
                console.clog(L.SESSION,'shut it down?',this.debugState())
                this.shutdown()
            }
        },
        sendGCM: function(data) {
            var msgid = makemsgid()
            var dst = jstorrent.gcm_appid  + "@gcm.googleapis.com"
            console.log('sending msg',msgid,'to',dst)
            chrome.gcm.send( {destinationId:dst,
                              messageId:msgid,
                              timeToLive: 20, // 60 seconds
                              data:data
                             }, function(resp){
                                 var lasterr = chrome.runtime.lastError
                                 if (lasterr) {
                                     console.error('error sending gcm',lasterr)
                                 } else {
                                     console.log('sent message',resp)
                                 }
                             })
        },
        runEvent: function(event) {
            this.eventData = event
            console.clog(L.SESSION,'run event',event)
            switch(event.type) {
            case 'onMessageExternal':
                if (event.request.command == 'add-url') {
                    this.wantsUI = true
                }
                this.launch(event)
                break
            case 'onLaunched':
                this.wantsUI = true
                console.log('wants UI')
                this.launch(event)
                break
            case 'onStartup':
                // called when chrome browser is opened fresh
                if (this.options.get('start_in_background')) {
                    this.launch(event)
                }
                break
            case 'onInstalled':
                // called if chrome.runtime.reload from background page
                if (this.options.get('start_in_background')) {
                    this.launch(event)
                }
                break
            case 'onSuspend':
                console.log('going to suspend. great!')
                var fgapp = this.get_fgapp()
                if (fgapp) {
                    fgapp.runtimeMessage(event.type)
                }
                break
            case 'onSuspendCanceled':
                console.log('suspend canceled!')
                var fgapp = this.get_fgapp()
                if (fgapp) {
                    fgapp.runtimeMessage(event.type)
                }
                break
            case 'gcmMessage':
                this.handleGCM(event)
                break
            default:
                console.log('other/unrecognized runtime event',event)
            }
        },
        get_fgapp: function() {
            var mainwin = chrome.app.window.get(MAINWIN)
            return mainwin && mainwin.contentWindow && mainwin.contentWindow.fgapp
        },
        handleGCM: function(event) {
            // gets handled in js/client.js
            var data = event.message.data
            var reqid = data.reqid
            console.assert(reqid)
            this.launch(event)
        }
    }
    for (var m in SessionProto) Session.prototype[m] = SessionProto[m]
    jstorrent.Session = Session
})()
