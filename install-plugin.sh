# path to the Plugins folder within Sketch
PLUGINS_PATH="$HOME/Library/Application Support/com.bohemiancoding.sketch3/Plugins"

DIR=`dirname $0`
DOWNLOAD_LOCATION="$DIR/export-to-icns.sketchplugin"

# move the plugin to Sketch Application Support
mv "$DOWNLOAD_LOCATION" "$PLUGINS_PATH"
if [ $? -ne 0 ]
then
    echo "Error: export-to-icns could not be installed."
else
    echo "Success: export-to-icns successfully installed."
fi