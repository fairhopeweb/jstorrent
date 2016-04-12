var MAINWIN = 'mainWindow2'
var DEVMODE = false
if (! chrome.runtime.getManifest().update_url) { // remove this for prod, could cause crash
    console.log('UNPACKED - DEV MODE!')
    DEVMODE = true
}
