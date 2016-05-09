document.addEventListener('DOMContentLoaded',onready)
var jsanalytics = null

function onready() {
    chrome.runtime.getBackgroundPage( function(bg) {
        jsanalytics = new Analytics({app:bg.session})
		console.log('sending init to bg')
        bg.session.onAnalyticsPageInit(window)
    })
}
