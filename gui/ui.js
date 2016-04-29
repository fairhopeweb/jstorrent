document.addEventListener('DOMContentLoaded',onready)
var session = null
var fgapp = null
var app = null
var client = null
var clientwin = chrome.app.window.get('client').contentWindow

function onready() {
    chrome.runtime.getBackgroundPage( function(bg) {
        session = bg.session
        client = clientwin.client
        fgapp = new jstorrent.AppForeground
        app = fgapp
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
        bg.session.onUIPageInit(window)
    })
}
