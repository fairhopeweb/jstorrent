document.addEventListener('DOMContentLoaded',onready)
var session = null
var fgapp = null
var app = null
var client = null
var bgwin = null
var clientwin = null

function onready() {
    chrome.runtime.getBackgroundPage( function(backgroundPage) {
        clientwin = chrome.app.window.get('client').contentWindow
        bgwin = backgroundPage
        session = bgwin.session
        client = clientwin.client
        fgapp = new jstorrent.AppForeground
        app = fgapp
        client.fgapp = fgapp
        fgapp.notifications = session.notifications
        fgapp.client = client
        fgapp.options = session.options
        fgapp.analytics = session.analytics
        fgapp.bind_misc_client_torrent()
        var ui = new UI({client:client})
        fgapp.UI = ui
        if (client.ready) {
            ui.restoreState()
        } else {
            client.on('ready', function() {
                ui.restoreState()
            })
        }
        onappready()
        bgwin.session.onUIPageInit(window)

        
    })
}
