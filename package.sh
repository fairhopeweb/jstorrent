rm package.zip

zip package.zip manifest.json \
    -r _locales \
    *.js \
    README.md \
    LICENSE \
    TODO.txt \
    js-*.png \
    JS-LOGO-2x.png \
    js/*.js \
    js/deps/*.js \
    js/deps/SlickGrid/*.js \
    js/deps/SlickGrid/slick.grid.css \
    js/deps/SlickGrid/css/smoothness/jquery-ui-1.8.16.custom.css \
    js/deps/SlickGrid/css/smoothness/images/*.png \
    js/deps/SlickGrid/plugins/slick.rowselectionmodel.js \
    js/deps/SlickGrid/lib/jquery.event.drag-2.2.js \
    js/deps/bootstrap-dist/css/bootstrap.min.css \
    js/deps/bootstrap-dist/js/bootstrap.min.js \
    js/deps/bootstrap-dist/fonts/glyphicons-halflings-regular.woff \
    gui/*.js \
    gui/*.css \
    gui/*.html \
    js/web-server-chrome/*.js \
    -x js/web-server-chrome/*buy* \
    -x js/*old* \
    -x *scratch* \
    -x "*.*~"    
