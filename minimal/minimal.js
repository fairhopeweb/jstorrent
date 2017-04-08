function clientready() {
  console.log('client ready')
  if (client.disks.items.length > 0) {
    client.add_from_url('44d5a7a86f4cd3b3a0c42b6e4ca5bd2d4c107b37', info => {
      info.torrent.add_peer_string('192.168.1.134:35974')
    })
  } else {
    console.log("NO DISKS SETUP. run client.prompt_download_location()")
  }

}

var waitForReady = setInterval( () => {
  if (window.session && session.ready) {
    var client = new jstorrent.Client({app:session, id:'client01', callback:clientready})
    window.client = client
    window.app = session
    app.client = client
    clearInterval(waitForReady)

  }
},200)

jstorrent.options.disable_trackers = true

var minimal_choose = document.getElementById("minimal_choose")
if (minimal_choose) {
  minimal_choose.addEventListener('click',e=>{
    var opts = {'type':'openDirectory'}
    chrome.fileSystem.chooseEntry(opts,
                                  entry => {
                                    chrome.runtime.getBackgroundPage( bg => {
                                      bg.client.set_default_download_location(entry)
                                    })
                                  })
    
  })
}
