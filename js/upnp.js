// ssdp
(function() {
    function UPNP(opts) {
        this.ssdp = new SSDP({client:this})
        this.ssdp.addEventListener('device',this.onDevice.bind(this))
        this.ssdp.search() // stop searching after a bit.
        this.devices = []
    }
    UPNP.prototype = {
        onDevice: function(info) {
            console.log('found an internet gateway device',info)
            var device = new GatewayDevice(info)
            this.devices.push( device )
        },
        getIP: function(callback) {
            if (this.devices.length == 0) {
                callback({error:'no devices'})
                return
            }
            var device = this.devices[0]
            device.request('hello', callback)
        }
    }
    
    function GatewayDevice(info) {
        this.info = info
        this.description_url = info.headers.location
        this.services = [
            'urn:schemas-upnp-org:service:WANIPConnection:1',
            'urn:schemas-upnp-org:service:WANPPPConnection:1'
        ]
    }
    GatewayDevice.prototype = {
        get: function(url, callback) {
            var xhr = new WSC.ChromeSocketXMLHttpRequest
            console.log('opening url',url)
            xhr.open("GET",url)
            function onload(evt) {
                if (evt.target.code == 200) {
                    var response = new TextDecoder('utf-8').decode(evt.target.response)
                    var parser = new DOMParser
                    var parsed = parser.parseFromString(response, "text/xml")
                    debugger
                }
            }
            xhr.onload = xhr.onerror = xhr.ontimeout = onload
            xhr.send()
        },
        get_service: function(name, callback) {
            this.get(this.description_url, callback)
        },
        request: function(action, callback) {
            this.get_service(name,callback)
        }
    }
    
    function SSDP(opts) {
        this.client = opts.client
        this.multicast = '239.255.255.250'
        this.port = 1900
        this.searchdevice = 'urn:schemas-upnp-org:device:InternetGatewayDevice:1'
        chrome.sockets.udp.onReceive.addListener( this.onReceive.bind(this) )
        chrome.sockets.udp.onReceiveError.addListener( this.onReceive.bind(this) )
        this.sockMap = {}
        this.lastError = null
        this.searching = false
        this._event_listeners = {}
    }

    SSDP.prototype = {
        addEventListener: function(name, callback) {
            if (! this._event_listeners[name]) {
                this._event_listeners[name] = []
            }
            this._event_listeners[name].push(callback)
        },
        trigger: function(name, data) {
            var cbs = this._event_listeners[name]
            if (cbs) {
                cbs.forEach( function(cb) { cb(data) } )
            }
        },
        onReceive: function(result) {
            var state = this.sockMap[result.socketId]
            var resp = new TextDecoder('utf-8').decode(result.data)
            if (! (resp.startsWith("HTTP") || resp.startsWith("NOTIFY"))) { return }
            var lines = resp.split('\r\n')
            var headers = {}
            // Parse headers from lines to hashmap
            lines.forEach(function(line) {
                line.replace(/^([^:]*)\s*:\s*(.*)$/, function (_, key, value) {
                    headers[key.toLowerCase()] = value;
                });
            })
            if (headers.st == this.searchdevice) {
                //console.log('SSDP response',headers,result)
                var device = {
                    remoteAddress: result.remoteAddress,
                    remotePort: result.remotePort,
                    socketId: 977,
                    headers: headers
                }
                this.trigger('device',device)
            }
        },
        error: function(data) {
            this.lastError = data
            console.clog(L.SSDP, "error",data)
            this.searching = false
            // clear out all sockets in sockmap
            this.cleanup()
        },
        cleanup: function() {
            for (var socketId in this.sockMap) {
                chrome.sockets.udp.close(parseInt(socketId))
            }
            this.sockMap = {}
        },
        stopsearch: function() {
            console.clog(L.SSDP, "stopping ssdp search")
            // stop searching, kill all sockets
            this.searching = false
            this.cleanup()
        },
        search: function(opts) {
            if (this.searching) { return }
            setTimeout( this.stopsearch.bind(this), 10000 )
            var req = 'M-SEARCH * HTTP/1.1\r\n' +
                'HOST: ' + this.multicast + ':' + this.port + '\r\n' +
                'MAN: "ssdp:discover"\r\n' +
                'MX: 1\r\n' +
                'ST: ' + this.searchdevice + '\r\n' +
                '\r\n'
            var state = {req:req, opts:opts}
            chrome.sockets.udp.create(function(sockInfo) {
                state.sockInfo = sockInfo
                this.sockMap[sockInfo.socketId] = state
                chrome.sockets.udp.setMulticastTimeToLive(sockInfo.socketId, 1, function(result) {
                    if (result < 0) {
                        this.error({error:'ttl',code:result})
                    } else {
                        chrome.sockets.udp.bind(state.sockInfo.socketId, '0.0.0.0', this.port, this.onbound.bind(this,state))
                    }
                }.bind(this))
            }.bind(this))
        },
        onbound: function(state,result) {
            if (result < 0) {
                this.error({error:'bind error',code:result})
                return
            }
            console.clog(L.SSDP,'bound')
            chrome.sockets.udp.joinGroup(state.sockInfo.socketId, this.multicast, this.onjoined.bind(this,state))
        },
        onjoined: function(state, result) {
            if (result < 0) {
                this.error({error:'join multicast',code:result})
                return
            }
            chrome.sockets.udp.send(state.sockInfo.socketId, new TextEncoder('utf-8').encode(state.req).buffer, this.multicast, this.port, this.onsend.bind(this))
            console.log('sending to',this.multicast,this.port)
        },
        onsend: function(result) {
            console.log('sent result',result)
        }
    }
    jstorrent.UPNP = UPNP
})();
