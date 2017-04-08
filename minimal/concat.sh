rm all.js
for f in "conf.js" "common.js" "notifications.js" "js/options.js" "session.js" "background.js"; do cat ../$f >> all.js; echo ";" >> all.js; done

# add for prod
echo ";" >> all.js
cat "js/log-full.js" >> all.js
echo ";" >> all.js


for f in `cat src.txt`; do cat $f >> all.js; echo ';' >> all.js; done

# add this for prod
echo ";" >> all.js
cat minimal.js >> all.js


rm mintor.zip
zip mintor.zip manifest.json all.js minimal.html
