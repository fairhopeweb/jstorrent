window.reload = chrome.runtime.reload
//document.querySelector('core-splitter').size=269

document.addEventListener("DOMContentLoaded", onready);

function destroyChildren(d) {
    while (d.firstNode) { d.removeChild(d.firstNode) }
}

function DetailController() {
    this.torrent = null
    this.view = null
}
_.extend(DetailController.prototype, {
    setContext: function(torrent) {
        this.torrent = torrent
        torrent.ensureLoaded( function() {
            torrent.initializeFiles()
            //this.view = document.querySelector('torrent-files').$.list = torrent.files.items
            //console.log('setcontext',torrent.hashhexlower,torrent.files.items)
            flist.data = torrent.files.items
        })
    }
})

window.views = {
    detailController: new DetailController
}

window.components = {
    torrentsList: null
}

function client_ready() {
    console.log('client ready')
    
    //app.UI.torrents = _tlist // XXX race condition. when is polymer element ready??
    //app.UI.torrents.torrents = client.torrents.items

    for (var i=0; i<client.torrents.items.length; i++) {
        app.UI.torrents.addTorrent(client.torrents.items[i])
    }

}

function PolymerUI(opts) {
    console.log('new PolymerUI()')
    this.app = opts.app
    this.torrents = null
}
_.extend(PolymerUI.prototype, {
    
})

function JSTorrentPolymerApp() {
    this.options = new jstorrent.Options({app:this})
    this.fileMetadataCache = new jstorrent.FileMetadataCache
    this.entryCache = new jstorrent.EntryCache
    this.UI = new PolymerUI({app:this})
}
_.extend(JSTorrentPolymerApp.prototype, {
    canDownload: function() { return true },
    runtimeMessage: function(msg) {
        console.warn('runtime message!',msg)
        if (msg == 'onSuspend') {
            console.error("APP ABOUT TO CRASH!! EEE!!!")
        }
    },
    registerLaunchData: function(launchData) {
        if (this.client.ready) {
            this.client.handleLaunchData(launchData)
        } else {
            this.client.on('ready', _.bind(function() {
                this.client.handleLaunchData(launchData)
            },this))
        }
    },
    highlightTorrent: function(hashhexlower) {
        var row = this.client.torrents.keyeditems[hashhexlower]
        if (this.UI) {
            this.UI.torrents.selectItem( row )
            this.UI.torrents.scrollIntoViewIfNeeded( row )
            //this.UI.torrenttable.grid.scrollRowIntoView(row);
            //this.UI.torrenttable.grid.flashCell(row, 0, 500);
        }
    },
    analytics: { sendEvent: function(){} }
})

function options_ready(app) {
    console.log('options loaded... creating client')
    window.client = new jstorrent.Client({app:app, id:'client01'});
    app.client = client
    client.on('ready', client_ready)    
}

function onready() {
    console.log('domcontentloaded')

    //window.app = new jstorrent.App({tab:true}); // tied into UI too much
    var app = new JSTorrentPolymerApp
    window.app = app
    app.options.load( options_ready.bind(this, app) )


    function keydown(evt) {
        console.log('keydown',evt)
        if (evt.metaKey || evt.ctrlKey) {
            if (evt.keyCode == 82) {
                console.log('received ctrl(meta)-r, reload app')
                chrome.runtime.reload()
                // ctrl-r
            }
            // prevent chrome app close window etc shortcuts
            // metakey is osx
            // ctrlkey for win

            //evt.preventDefault() // dont prevent ctrl-w
        }
    }
    document.body.addEventListener('keydown', keydown)

}


document.addEventListener('polymer-ready', function() {
    console.log('polymer-ready');
});

document.addEventListener('WebComponentsReady', function() {
    // not called/needed anymore
    console.log('WebComponentsReady');
});
