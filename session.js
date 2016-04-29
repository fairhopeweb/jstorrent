(function() {
    console.log('session.js')
    function Session(event) {
        // load chrome.storage.local settings
        // (maybe resume.dat file from PERSISTENT isolated storage)
        // setup listen for gcm messages if setting wants it.
        this.id = 'app01'
        this.options = null
        this.permissions = null
        this.notifications = new jstorrent.Notifications
        this.events = []
        this.ready = false
        this.launching = false
        this.eventData = null
        this.wantsUI = false
        this.thinking = null

        this.analytics = false
        this.client = false
        this[MAINWIN] = false
        this.registerEvent(event)
        
        async.parallel( [ this.getPermissions.bind(this),
                          this.getOptions.bind(this) ],
                        this.onReady.bind(this))
    }
    SessionProto = {
        onWindowClosed: function(id) {
            console.clog(L.SESSION,'window closed',id)
            this[id] = null
            if (id == MAINWIN) {
                this.UI = null
                var opts = chrome.app.window.get('options')
                if (opts) { opts.close() }
                var help = chrome.app.window.get('help')
                if (help) { help.close() }
            }
        },
        onWindowRestored: function() {
            console.log('main window restored. re-create UI')
            this.client.fgapp.UI.undestroy()
        },
        onWindowMinimized: function() {
            console.log('main window minimized. destroy UI')
            this.client.fgapp.UI.destroy()
        },
        notify: function(msg, prio) {
            console.log('app notify',msg,'prio',prio)
            if (this.client && this.client.fgapp) {
                this.client.fgapp.notify(msg,prio)
            }
        },
        createNotification: function(opts) {
            console.log('create notification',opts)
            if (this.client && this.client.fgapp) {
                this.client.fgapp.createNotification(opts)
            }
        },
        shutdown: function() {
            if (false) {
                this.analytics = null
                this.UI = null
                if (this.client) {
                    this.client.fgapp = null
                }
                this.client = null
            }
            
            var cwin = chrome.app.window.get('client')
            if (cwin) cwin.close()
            var awin = chrome.app.window.get('analytics')
            if (awin) awin.close()
            console.log(this.thinking)
            if (this.thinking) {
                clearInterval(this.thinking)
                this.thinking = null
            }
        },
        addListener: function(t,cb) {
            if (! this._listeners[t]) this._listeners[t] = []
            this._listeners[t].push(cb)
        },
        trigger: function(t) {
            var cbs = this._listeners[t]
            if (cbs) cbs.forEach( function(cb){cb()} )
        },
        registerEvent: function(event) {
            console.clog(L.SESSION,'register event',event)
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
            console.clog(L.SESSION,'ready')
            this.ready = true
            this.runEvents()
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
            this.client = win.client
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
            console.log('launchdone',this.eventData)
            this.launching = false
            this.client.handleLaunchData(this.eventData)
            this.eventData = null
            this.runEvents()
        },
        launch: function(data) {
            if (! this.thinking) {
                this.thinking = setInterval(this.think.bind(this), 10000)
            }
            if (this.launching) { return }
            this.launching = true
            if (this[MAINWIN]) {
                // have all windows already
                this.launchDone()
            } else if (this.wantsUI && this.analytics && this.client) {
                this.createUI()
            } else {
                this.createAnalytics()
            }
        },
        think: function() {
            //console.clog(L.SESSION,'think')
            if (this.client && this.client.activeTorrents.items.length == 0 && ! chrome.app.window.get(MAINWIN) && ! this.launching) {
                console.clog(L.SESSION,'shut it down.')
                this.shutdown()
            }
        },
        runEvent: function(event) {
            this.eventData = event
            console.clog(L.SESSION,'run event',event)
            switch(event.type) {
            case 'onMessageExternal':
                this.launch(event)
                break;
            case 'onLaunched':
                this.wantsUI = true
                console.log('wants UI')
                this.launch(event)
                break;
            case 'onInstalled':
                if (this.options.get('start_in_background')) {
                    this.launch(event)
                }
                break
            default:
                console.log('other/unrecognized runtime event',event)
            }
        }
    }
    for (var m in SessionProto) Session.prototype[m] = SessionProto[m]
    jstorrent.Session = Session
})()
