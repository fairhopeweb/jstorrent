if (! window.jstorrent) { window.jstorrent = {} }

jstorrent.gcm_identity_server = 'https://www.jstorrent.com'
jstorrent.gcm_appid = "432934632994"

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
function runParallel(fns, cb) {
    var results = {}
    var returned = 0
    var desired = fns.length
    for (var i=0; i<desired; i++) {
        fns[i](function(which, result) {
            results[which] = result
            returned++
            if (returned == desired) {
                results.length = desired
                cb(results)
            }
        }.bind(window, i))
    }
}

function setup_debug_timeouts() {
    // debug timeouts
    var logthem = false
    
    var orig_setInterval = setInterval
    var orig_clearInterval = clearInterval
    var orig_setTimeout = setTimeout
    var orig_clearTimeout = clearTimeout
    var _tctr = 0
    var _ictr = 0
    var _debug_timeouts_map = {}
    var _debug_timeouts_map_r = {}
    var _debug_timeouts = {}
    var _debug_intervals_map = {}
    var _debug_intervals_map_r = {}
    var _debug_intervals = {}
    window.debugTimeouts = function() {
        console.log('intervals',_debug_intervals,'timeouts',_debug_timeouts)
        console.log('interval maps:',_debug_intervals_map,_debug_intervals_map_r)
        console.log('timeout maps:',_debug_timeouts_map,_debug_timeouts_map_r)
    }
    setInterval = function(fn,t) {
        _ictr++
        var id = orig_setInterval(function(id2) {
            var tid = _debug_intervals_map[id2]
            delete _debug_intervals[tid]
            delete _debug_intervals_map[id2]
            delete _debug_intervals_map_r[tid]
            fn()
        }.bind(this,_ictr),t)
        _debug_intervals_map[_ictr] = id
        _debug_intervals_map_r[id] = _ictr
        if (logthem) console.log('setInterval',id,'time',t)
        _debug_intervals[id] = fn
        return id
    }
    setTimeout = function(fn,t) {
        _tctr++
        var id = orig_setTimeout(function(id2) {
            var tid = _debug_timeouts_map[id2]
            delete _debug_timeouts[tid]
            delete _debug_timeouts_map[id2]
            delete _debug_timeouts_map_r[tid]
            fn()
        }.bind(this,_tctr),t)
        if (t > 60000) { console.log('long timeout timer',id,t,fn) }
        _debug_timeouts_map[_tctr] = id
        _debug_timeouts_map_r[id] = _tctr
        if (logthem) console.log('setTimeout',id,'time',t)
        _debug_timeouts[id] = fn
        return id
    }
    clearTimeout = function(id) {
        if (logthem) console.log('clearTimeout',id)
        delete _debug_timeouts[id]
        var tmp = _debug_timeouts_map_r[id]
        delete _debug_timeouts_map[tmp]
        delete _debug_timeouts_map_r[id]
        orig_clearTimeout(id)
    }
    clearInterval = function(id) {
        if (logthem) console.log('clearInterval',id)
        delete _debug_intervals[id]
        var tmp = _debug_intervals_map_r[id]
        delete _debug_intervals_map[tmp]
        delete _debug_intervals_map_r[id]
        orig_clearInterval(id)
    }
}
if (DEVMODE) setup_debug_timeouts()
function assert(bool) {
    if (! bool && DEVMODE) debugger // normally assert would throw exception
}
function killAllSockets() {
    chrome.sockets.tcp.getSockets( function(socketInfos) {
        var d = {}
        for (var i=0; i<socketInfos.length; i++) {
            chrome.sockets.tcp.close(socketInfos[i].socketId)
        }
    })
    chrome.sockets.tcpServer.getSockets( function(socketInfos) {
        var d = {}
        for (var i=0; i<socketInfos.length; i++) {
            chrome.sockets.tcpServer.close(socketInfos[i].socketId)
        }
    })
    chrome.sockets.udp.getSockets( function(socketInfos) {
        var d = {}
        for (var i=0; i<socketInfos.length; i++) {
            chrome.sockets.udp.close(socketInfos[i].socketId)
        }
    })
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
var GCMSERVERID = "432934632994"
