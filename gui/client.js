console.log("client.js")
document.addEventListener('DOMContentLoaded',onready)
var client = null

function onready() {
    chrome.runtime.getBackgroundPage( function(bg) {
        function ready() {
            client = new jstorrent.Client({app:bg.session, id:'client01'})
            window.app = bg.session
			console.log('sending init to bg')
            bg.session.onClientPageInit(window)
        }
        if (DEVMODE && bg.session.options.get('wait_devtools')) {
            setTimeout( ready, 2000 )
        } else {
            ready()
        }
    })
}
