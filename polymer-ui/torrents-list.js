(function() {

    Polymer({
        is: 'torrents-list',
        addIdx: 0,
        deleteIdx: 0,
        count: 200,
        multi: false,
        ready: function() {
            console.log('torrents-list ready')
            this.initArrayEmpty();
            window._tlist = this
        },
        addTorrent: function(torrent) {
            this.$$("iron-data-table").$.list.push('items', torrent._attributes)
        },
        properties: {
            items: { type: Array,
                     /*
                     value: [
                         {name:"foobar", state:"complete", received:'100MB',complete:'100%',downspeed:'10KB/S',eta:''},
                         {name:"A super cool show", state:"downloading", received:'300MB',complete:'80%',downspeed:'300KB/S',eta:'5m'}
                     ]
                     */
                     value:[]
                   }
        },
        byteUnits: byteUnits,
        byteUnitsSec: byteUnitsSec,
        mul100: function(v) { return v * 100 },
        toggleSelection: function(e) {
            var item = this.$.torrentsList.itemForElement(e.target);

            var target
            for (var i=0; i<e.path.length; i++) {
                if (e.path[i].tagName == 'TORRENTS-LIST') {
                    target = e.path[i-1]
                    break
                }
            }

            if (target.classList.contains('selected')) {
                target.classList.remove('selected')
            } else {
                target.classList.add('selected')
            }
            this.$.selector.select(item);
            console.log(this.selected)
        },
        onSelect: function(event, object) {
            console.log('onselect',object)
            if (object.item.classList.contains("selected")) {
                views.detailController.setContext(object.data)
            }
        },
        addRecord: function() {
            this.data.splice(this.addIdx, 0, {
                id: ++this.count,
                name: namegen.generateName(4, 8),
                details: strings[this.count % 3],
                image: this.count % 4,
                value: 0,
                type: 0,
                checked: false
            });
        },
        deleteRecord: function() {
            this.data.splice(this.deleteIdx, 1);
        },
        deleteSelection: function() {
            var i, idx;
            if (this.multi) {
                if (this.selection.length) {
                    for (i=0; i<this.selection.length; i++) {
                        idx = this.data.indexOf(this.selection[i]);
                        this.data.splice(idx, 1);
                    }
                }
            } else {
                idx = this.data.indexOf(this.selection);
                this.data.splice(idx, 1);
            }
        },
        clearSelection: function() {
            this.$.list.clearSelection();
        },
        deleteAll: function() {
            this.data.splice(0,this.data.length);
            // this.data.length = 0;
        },
        deleteArray: function() {
            this.data = null;
        },
        initArrayEmpty: function() {
            this.torrents = [];
        }
    });
})();
