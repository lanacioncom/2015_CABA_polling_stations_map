2015 CABA Elections map by polling station and political party, and PASO comparison
===================================================================================

## Introduction
This project was built to visualize the results of the past 2015 CABA elections in terms of which party has won in each polling station, what percentage did each party get and how it compares with the results from the same polling station in the past PASO elections (primary elections).

## Backend
For the backend we have received the results by polling table and political list as a CSV file together with other data dictionary files also as CSV.

We also had the geolocated polling stations provided by the city electoral board. 

Finally we had the PASO results by polling station from a previous project, so we reused that information after validating that the polling tables relation with polling stations had not changed significantly and could be recalculated safely.

We have used _csvkit_ command line binaries to crunch, clean and build the intermediate CSV files.

We have then ran them through a python script that uses _dataset_ to load them into a postgreSQL database.

We then have imported the final results to _cartodb_ postgis DB.

Usage info: [here](backend/README.md)

## Frontend
For the frontend we wanted to use [D3js](http://d3js.org) as an overlay on top of leaflet because that would give us more control and speed over the interaction with the reader that in our previous project [2015 PASO CABA map](git://github.com/lanacioncom/2015_paso_caba_map.git).

We also wanted to engage the reader into finding the region they related more with to check the elections results or make custom analysis. We were playing with the idea of letting the reader paint over the map to select the polling stations they wanted to get the results from. Sometimes administrative levels are just too rigid and do not capture the living parts of a city.

Having previous results from PASO elections gave us the opportunity to make a visual comparison on the results for each party at a detailed level. While designing the app we wanted to be able to have a quick overview of the differences and went with bicolor arrows to show the differences at one glance.

Since we were using _requirejs_ again it is important that we use the [_optimizer_](http://requirejs.org/docs/optimization.html) to generate a combined javascript file and skip performing too many HTTP requests on the client side.

Since _underscore_ comes bundled inside the _cartodbjs_ library we have used it for our templates to generate a modular approach to the HTML generation. The [_requirejs text plugin_](https://github.com/requirejs/text) let's you import templates nicely into the app so that you can keep them separatedly as in our _webapp/templates_ folder.

Usage info: [here](webapp/README.md)

## Server
We are using _npm_, _bower_ and _gulp_ to automate the optimization and deployment process.

The deployment takes care of minimizing, uglifying and versioning the static files so that it plays nice with the newsroom http cache configuration.

We have used the [_gulp-requirejs_](https://www.npmjs.com/package/gulp-requirejs) node package to integrate the requirejs optimization in our gulp deployment process.

Usage info: [here](server/README.md)


## Technologies && Libraries
* Backend:
    [csvkit](https://csvkit.readthedocs.org/en/0.9.1/index.html), [dataset](https://dataset.readthedocs.org/en/latest/), [cartodb](https://cartodb.com/)
* Frontend:
    [d3js](http://d3js.org), [leaflet](), [leaflet-draw-plugin](), [cartodbjs](http://docs.cartodb.com/cartodb-platform/cartodb-js.html), [underscore](http://underscorejs.org/), [requirejs](http://requirejs.org/), 


## Credits
* [Cristian Bertelegni](https://twitter.com/cbertelegni)
* [Juan Elosua](https://twitter.com/jjelosua)
* [Gastón de la llana](https://twitter.com/gasgas83)
* [Pablo Loscri](https://twitter.com/ploscri)

## Acknowledgments

We would like to thank the creators and maintainers of the libraries used for this project. We stand in the shoulders of giants.




