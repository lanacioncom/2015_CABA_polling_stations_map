Frontend usage
==============

## Requirements
* Have [_nodejs_](https://nodejs.org/) && [_bower_](http://bower.io/) installed

## Process
1. Go to the server folder

        $ cd server

2. Install dependencies

        $ npm install && bower install

3. Run the local server

        $ gulp server

4. Open a browser on **http://localhost:8000** and play around. The server is using livereload so that any changes on the js or html files will be automatically published to the server.

## Implementation notes

* We wanted to let the reader *select one and only one* draw shape The original [_leaflet draw plugin_](https://github.com/Leaflet/Leaflet.draw) we have found the following [issue](https://github.com/Leaflet/Leaflet.draw/issues/315) with the idea to switch the drawing controls so that the user can only generate one shape at a time. We have found that in the switching process a reference was lost while firing disable events and gave a javascript error since the error was due to the removed control we have tweaked it so that it checks if the reference is still there and ignores it otherwise.

    ```js
    //On the L.EditToolbar _save method
    _save: function () {
        this._activeMode.handler.save();
        // Not sure why we need this hack but we do need it
        // Probably due to the switching process of drawcontrols in 
        // draw:deleted 
        if (this._activeMode) {
            this._activeMode.handler.disable();
        }
    },
    ```

* Also we have found that because we are using D3 on the overlayPane of leaflet together with the drawing plugin on removal of the drawing layer a orphan SVG kept interfering with the d3 layer interaction so we did a bit of a hack around css _pointer-events_ properties that should be investigated further.

* Finally cartodb.min.js was not available as a standalone bower project so we have included it in the github project inside the libs folder.


