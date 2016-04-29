document.addEventListener('DOMContentLoaded',onready)
var app = null
var fgapp = null
var client = null
var clientwin = chrome.app.window.get('client').contentWindow

function onready() {
    chrome.runtime.getBackgroundPage( function(bg) {
        app = bg.session
        fgapp = new jstorrent.AppForeground // UI/app glue controller basically
        fgapp.notifications = app.notifications
        fgapp.client = app.client
        app.client.fgapp = fgapp
        fgapp.options = app.options
        fgapp.bind_misc_client_torrent()
        onappready()
        fgapp.UI = app.UI
        bg.session.onUIPageInit(window)
    })
}
