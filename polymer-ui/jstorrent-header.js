(function(){
    Polymer({
        is: 'jstorrent-header',
        ready: function() {
            console.log('jstorrent-header ready')
        },
        toggle: function() {
            console.log('toggle!')
            if (!this.dropdown) {
                this.dropdown = this.querySelector('core-dropdown');
            }
            this.dropdown && this.dropdown.toggle();
        },
        btnStop: function() {
            console.log('stop button')
            app.UI.torrents.selected[0].stop()
        },
        btnDelete: function() {
            console.log('delete button')
            app.UI.torrents.selected[0].remove()
            debugger
        },
        btnPlay: function() {
            console.log('play button')
            app.UI.torrents.selected[0].start()
        },
        ready: function() {
            window.jstorrentheader = this
        },
        toggle: function() {
            
        }
    });
})();
