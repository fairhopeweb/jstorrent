document.addEventListener('DOMContentLoaded',onready)
var client = null

function onready() {
    chrome.runtime.getBackgroundPage( function(bg) {
        client = new jstorrent.Client({app:bg.session, id:'client01'})
        window.app = bg.session
        bg.session.onClientPageInit(window)
    })
}
