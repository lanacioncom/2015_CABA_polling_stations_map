Frontend usage
==============

## Requirements
* Have [_nodejs_](https://nodejs.org/) installed

## Process
1. Go to the deploy folder

        $ cd deploy

2. Install dependencies

        $ npm install

3. Run the local server

        $ gulp server

4. Open a browser on **http://localhost:8080** and play around. The server is using livereload so that any changes on the js or html files will be automatically published to the server.

## Implementation notes

* We wanted to let the reader *select one and only one* draw shape The original [_leaflet draw plugin_](https://github.com/Leaflet/Leaflet.draw) we have found the following [issue](https://github.com/Leaflet/Leaflet.draw/issues/315) with the idea to switch the drawing controls so that the user can only generate one shape at a time. We have found that in the swithching process a reference was lost while firing disable events and gave a javascript error since the error was due to the removed control we have tweaked it so that it checks if the reference is still there and ignores it otherwise.

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


