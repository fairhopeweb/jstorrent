if (false) {
    // debug timeouts
    var orig_setInterval = setInterval
    var orig_clearInterval = clearInterval
    var orig_setTimeout = setTimeout
    var orig_clearTimeout = clearTimeout
    setInterval = function(fn,t) {
        console.log('setInterval',t)
        return orig_setInterval(fn,t)
    }
    setTimeout = function(fn,t) {
        console.log('setTimeout',t)
        return orig_setTimeout(fn,t)
    }
    clearTimeout = function(id) {
        console.log('clearTimeout',id)
        return orig_clearTimeout(id)
    }
    clearInterval = function(id) {
        console.log('clearInterval',id)
        return orig_clearInterval(id)
    }
}

function reset_logging_flags() {
    var L = {
        INIT: { color: '#cef', show: true },
        UI: { color: '#ce0', show: true },
        APP: { color: 'darkgreen', show: true },
        SESSION: { color: 'darkgreen', show: true },
        TRACKER: { color: '#3e8', show: false },
        TORRENT: { color: '#0ae', show: true },
        DISKIO: { color: 'orange', show: true },
        DISK: { color: 'darkblue', show: true },
        STREAM: { color: 'orange', show: true },
        POWER: { color: 'blue', show: true },
        CLIENT: { color: 'green', show: true },
        PEER: { color: '#082', show: false },
        SEED: { color: '#082', show: false },
        SYSTEM: { color: '#236', show: true },
        DEV: { color: '#622', show: false },
        EVENT: { color: '#ddd', show: false },
        UPNP: { color: '#ddd', show: true },
        DHT: { color: '#ddd', show: false }
    }
    Object.keys(L).forEach( function(k) { L[k].name = k } )
    return L
}
window.L = reset_logging_flags()
function assert(bool) {
    if (! bool && DEVMODE) debugger // normally assert would throw exception
}
function debugSockets() {
    chrome.sockets.tcp.getSockets( function(socketInfos) {
        var d = {}
        for (var i=0; i<socketInfos.length; i++) {
            d[socketInfos[i].socketId] = socketInfos[i]
        }
        console.log('current tcp sockets',d)
    })
    chrome.sockets.tcpServer.getSockets( function(socketInfos) {
        var d = {}
        for (var i=0; i<socketInfos.length; i++) {
            d[socketInfos[i].socketId] = socketInfos[i]
        }
        console.log('current tcpServer sockets',d)
    })
    chrome.sockets.udp.getSockets( function(socketInfos) {
        var d = {}
        for (var i=0; i<socketInfos.length; i++) {
            d[socketInfos[i].socketId] = socketInfos[i]
        }
        console.log('current udp sockets',d)
    })
}

