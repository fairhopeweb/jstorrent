document.addEventListener('DOMContentLoaded',onready)
var jsanalytics = null

function onready() {
    chrome.runtime.getBackgroundPage( function(bg) {
        jsanalytics = new Analytics({app:bg.session})
        bg.session.onAnalyticsPageInit(window)
    })
}
