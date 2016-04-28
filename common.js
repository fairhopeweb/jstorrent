function assert(bool) {
    if (! bool && DEVMODE) debugger
}
function debugSockets() {
    chrome.sockets.tcp.getSockets( function(socketInfos) {
        var d = {}
        for (var i=0; i<socketInfos.length; i++) {
            d[socketInfos[i].socketId] = socketInfos[i]
        }
        console.log('current tcp sockets',d)
    })
    chrome.sockets.udp.getSockets( function(socketInfos) {
        var d = {}
        for (var i=0; i<socketInfos.length; i++) {
            d[socketInfos[i].socketId] = socketInfos[i]
        }
        console.log('current udp sockets',d)
    })
}

