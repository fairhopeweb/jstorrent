window.reload = chrome.runtime.reload
//document.querySelector('core-splitter').size=269
console.log('common.js')

document.addEventListener('polymer-ready', function() {
    console.log('polymer-ready');
});

document.addEventListener('WebComponentsReady', function() {
    // not called/needed anymore
    console.log('WebComponentsReady');
});
