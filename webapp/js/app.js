requirejs.config({
    baseUrl: 'js',
    paths: {
        'draw': '../libs/leaflet.draw',
        'templates': '../templates', 
        'text': '../libs/plugins/text',
        'd3': '../libs/d3.min',
    }
});

requirejs(['app/config', 'app/context', 'app/templates', 
           'app/helpers', 'app/view_helpers', 'app/draw','d3'],
function(config, ctxt, templates, helpers, view_helpers, draw, d3) {
  $(function() {
    "use strict";
    //JET: Load sections 
    $.get("data/diccionario_datos.json", function(data){
        config.diccionario_datos = data;
    });

    config.ancho = $(window).width();
    config.alto = $(window).height();

    $(window).resize(function() {
        config.ancho = $(window).width();
        config.alto = $(window).height();
    });

    // Set initial zoom level
    ctxt.current_zoomLevel = 12;

    ctxt.map = L.map('mapa_cont', {
        center: [-34.61597432902992, -58.442115783691406],
        zoom: ctxt.current_zoomLevel,
        minZoom: ctxt.current_zoomLevel,
        maxZoom: 16,
        attributionControl: false,
    });

    var mapboxUrl = config.cdn_proxy+'https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}';
    L.tileLayer(mapboxUrl, {
                            id: 'olcreativa.c409ba3f', 
                            attribution: "OpenStreetMaps", 
                            token: 'pk.eyJ1Ijoib2xjcmVhdGl2YSIsImEiOiJEZWUxUmpzIn0.buFJd1-sVkgR01epcQz4Iw'}).addTo(ctxt.map);

    // Template for the description of a given polling station
    var popup_tmpl = _.template(templates.popup);
    // Template to show error in case drawing does not intersect any polling station
    var popup_error_tmpl = _.template(templates.popup_error);
    // Template for the results of a given polling station
    var overlay_tmpl = _.template(templates.overlay);

    config.sql = new cartodb.SQL({
        user: config.CARTODB_USER
    });

    // Template that stores the query to execute once a polling station has been clicked
    var FEATURE_CLICK_SQL_TMPL = _.template(templates.feature_click_sql);

    //JET: sharing
    $("a#google").click(function(){
        window.open( config.google_url, "Compartir", "status = yes, height = 360, width = 500, resizable = yes, left = "+(config.ancho/2+250)+", top =" +(config.alto/2-150) );
        return false;
    });

    $("a#twit").click(function(){
        window.open( config.twitter_url, "Compartir", "status = yes, height = 360, width = 500, resizable = yes, left = "+(config.ancho/2+250)+", top =" +(config.alto/2-150) );
        return false;
    });

    $("a#facebook").click(function(){
        window.open( config.facebook_url, "Compartir", "status = yes, height = 360, width = 500, resizable = yes, left = "+(config.ancho/2+250)+", top =" +(config.alto/2-150) );
        return false;
    });

    // Template for the credits
    $('.creVent').html(_.template(templates.credits));

    // Overlay hide and show with css transitions
    var hideOverlay = function() {
        $('#overlay').css('left', '100%');
    };
    var showOverlay = function() {
        $('#overlay').css('left', '73%');
    };

    // Credits hide and show
    $(".creditos").click(function(){
       $(".creVent").fadeIn(200);
       $(".creVent .txts").delay(300).fadeIn(200);
    });

    $(".cerrar").click(function(){
       $(".creVent .txts").fadeOut(200);
       $(".creVent").delay(300).fadeOut(200);
    });

    // Hide overlay if dragged position is out of bounds
    ctxt.map.on('dragend', function(e, x, y) {
        if (ctxt.current_latlng !== null && !ctxt.map.getBounds().contains(ctxt.current_latlng)) {
            hideOverlay();
            ctxt.map.closePopup();
        }
    });

    // Close popup and overlay
    ctxt.map.on('popupclose', function() {
        if (ctxt.featureClicked) ctxt.featureClicked = false;
        helpers.close_slide();
    });

    var d3featureOver = function(d, i) {
        $('#mapa_cont').css('cursor', 'pointer');
    };

    var d3featureOut = function(d, i) {
        $('#mapa_cont').css('cursor', 'auto');
    };

    // Get data for the clicked polling station and show popup and overlay
    var d3featureClick = function(d, i, latlng) {
        if ($('div#instructivo').is(":visible")) {
            $('div#instructivo').fadeOut(200); 
        }
        $('#overlay *').fadeOut(200, function() { $(this).remove();});
        showOverlay();
        if (!latlng) {
            latlng = L.latLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
        }
        ctxt.current_latlng = latlng;
        ctxt.map.panTo(latlng);
        setTimeout(function() {
            var query = FEATURE_CLICK_SQL_TMPL({
                establecimiento: d.properties
            });
            config.sql.execute(query)
                .done(_.partial(featureClickDone, latlng, d.properties, true))
                .error(function(errors) {
                  // errors contains a list of errors
                  console.log(errors);
                });
        }, 200);
    };

    //Called when the Cartodb SQL has finished
    var featureClickDone = function(latlng, establecimiento_data, unique, votos_data) {
        var popup = L.popup()
            .setLatLng(latlng)
            .setContent(popup_tmpl({establecimiento: establecimiento_data,
                                    v: votos_data,
                                    dict_datos: config.diccionario_datos,
                                    unique: unique}))
            .openOn(ctxt.map);
        
        var d = votos_data.rows;
        d.forEach(function(d) {
            d.pct = (d.votos / establecimiento_data.positivos) * 100;
        });

        $('#results').html(overlay_tmpl({
            e: establecimiento_data,
            data: d,
            dict_datos: config.diccionario_datos,
            max: _.max(d, function(item){ return item.votos; }),
            vh: view_helpers
        }));

        $("#results a.cerrar").click(function(){
            helpers.close_slide();
        });

        
        $('#results').animate({right:'0%'}, 'fast', function(){
            helpers.animate_barras();
        });

        if (unique) {
            location.hash = "id_" + establecimiento_data.id_establecimiento;
        }
        
    };

    var filter_draw = function(e) {
        var draw_layer, latlng = null;
        if (e.type === "draw:created") {
            draw_layer = e.layer;
            latlng = draw_layer.getBounds().getCenter(); 
            draw.drawnItems.addLayer(draw_layer);
            draw.drawControlFull.removeFrom(ctxt.map);
            draw.drawControlEditOnly.addTo(ctxt.map);
            //Hack around the issue with two svgs inside leaflet-overlay-pane
            //Allow pointer events only when a shape is drawn
            $('svg.leaflet-zoom-animated').css('pointer-events','auto');
        }
        else {
            draw_layer = e.layers.getLayers()[0];
            latlng = draw_layer.getBounds().getCenter();
        }
        // Get the coordinates of the polygon we just drew
        var poly = draw_layer.getLatLngs();
        var sql_poly = [];
        for (var i in poly){
            sql_poly.push("CDB_LatLng("+poly[i].lat+","+poly[i].lng+")");
        }
        //SQL polygon must be a CLOSED loop
        sql_poly.push("CDB_LatLng("+poly[0].lat+","+poly[0].lng+")");
        //Center and zoom the map
        ctxt.map.panTo(latlng);
        config.sql.execute(templates.draw1_sql,{bounds: sql_poly.join()})
        .done(function(data) {
            // Check to see if there's any intersection
            if (data.total_rows) {
                var establecimiento_data = {nombre: "SELECCIÓN"};
                var ids = [];
                var d = data.rows;
                d.forEach(function(d) {
                    ids.push(d.id_establecimiento);
                });
                establecimiento_data.electores = _.reduce(d, function(m,e) { return m + e.electores; }, 0);
                establecimiento_data.votantes = _.reduce(d, function(m,e) { return m + e.votantes; }, 0);
                establecimiento_data.positivos = _.reduce(d, function(m,e) { return m + e.positivos; }, 0);
                config.sql.execute(templates.draw2_sql,{ids: ids.join()})
                .done(_.partial(featureClickDone, latlng, establecimiento_data, false))
                .error(function(errors) {
                    console.log(errors);
                });
            }
            else {
                var msg_header = "Error";
                var msg_body = "No se ha encontrado ningún establecimiento con la selección actual";
                var popup = L.popup()
                    .setLatLng(latlng)
                    .setContent(popup_error_tmpl({message_header: msg_header,
                                    message_body: msg_body}))
                    .openOn(ctxt.map);
            }
        });
    };

    // D3 layer
    var svg = d3.select(ctxt.map.getPanes().overlayPane)
                .append("svg").attr("id", "d3layer");
    var g = svg.append("g").attr("class", "leaflet-zoom-hide");

    config.sql.execute(templates.d3_geom_sql,null,{format: 'GeoJSON'})
    .done(function(collection) {
        var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform).pointRadius(path_radius);

        var features = g.selectAll("path")
                        .data(collection.features, function(d) {return d.properties.id_establecimiento;});

        features.enter()
                .append("path")
                .attr('id', function(d) {return "id"+d.properties.id_establecimiento;})
                .on('mouseover', d3featureOver)
                .on('mouseout', d3featureOut)
                .on('click', d3featureClick);

        ctxt.map.on("viewreset", reset);
        reset();
        //We need to check the permalink
        update_map();

        // Reposition the SVG to cover the features.
        function reset() {
            ctxt.current_zoomLevel = ctxt.map.getZoom();
            var bounds = path.bounds(collection),
                         topLeft = bounds[0],
                         bottomRight = bounds[1];
            console.log(bounds);
            // We need to give some padding because of the path pointRadius
            var padding = 30;
            topLeft = [topLeft[0]-padding, topLeft[1]-padding];

            svg.attr("width", bottomRight[0] - topLeft[0]+padding)
               .attr("height", bottomRight[1] - topLeft[1]+padding)
               .style("left", topLeft[0] + "px")
               .style("top", topLeft[1]+ "px");

            g.attr("transform", "translate(" + (-topLeft[0]) + "," + (-topLeft[1]) + ")");
            if (!(_.isEmpty(ctxt.presults))) {
                features.attr("d", path).style("fill", path_color);
            }
        }

        // Use Leaflet to implement a D3 geometric transformation.
        function projectPoint(x, y) {
            var point = ctxt.map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

        function path_radius(d) {
            var r = null;
            var pid = null;
            var fid = d.properties.id_establecimiento;
            if (!ctxt.selp) {
                pid = "winner";
            }
            else {
                pid = ctxt.selp;
            }
            var pos = d.properties.positivos;
            var v = ctxt.presults[pid][fid].votos / pos;
            var min = ctxt.presults[pid].extent[0] / pos;
            var max = ctxt.presults[pid].extent[1] / pos;
            console.log("min: "+min);
            console.log("max: "+max);
            var s = d3.scale.sqrt().domain([min,max]).range([1,12]);
            console.log(s(v));
            return s(v);
        }

        function path_color(d) {
            var r = null;
            if (!ctxt.selp) {
                var fid = d.properties.id_establecimiento;
                var pid = ctxt.presults.winner[fid].id_partido;
                console.log(pid);
                r = config.diccionario_datos[pid].color_partido;
            }
            else {
                r = config.diccionario_datos[ctxt.selp].color_partido;
            }
            return r;
        }

        function update_data(d,i) {
            if (ctxt.selp) {
                var votos = ctxt.presults[ctxt.selp][d.properties.id_establecimiento].votos;
                d.properties["p"+ctxt.selp] = {"votos": votos};
                console.log(d.properties);
            }
        }

        function redraw_features() {
            g.selectAll("path").transition().duration(1000)
                 .attr("d",path.pointRadius(path_radius))
                 .style("fill", path_color);
        }

        function check_available_data() {
            console.log(ctxt.presults);
            var p = ctxt.selp;
            if (!ctxt.selp) {
                p = "winner";
            }
            if(p in ctxt.presults) {
                console.log("found data");
                return true;
            }
            console.log("did not find data");
            return false;
        }

        function update_map() {
            if (!check_available_data()) {
                if (!ctxt.selp) {
                    // from here http://stackoverflow.com/questions/3800551/select-first-row-in-each-group-by-group
                    config.sql.execute(templates.d3_winner_sql)
                    .done(function(collection) {
                        var rows = collection.rows;
                        ctxt.presults.winner = d3.nest()
                                    .key(function(d) {return d.id_establecimiento;})
                                    .rollup(function(data) { return data[0]; })
                                    .map(rows);

                        // Get the extent of the data and store it for later use
                        ctxt.presults.winner.extent = d3.extent(rows, function(r) {return r.votos;});
                        redraw_features();
                    });
                }
                else {
                    config.sql.execute(templates.d3_diff_sql,{id_partido: ctxt.selp})
                    .done(function(collection) {
                        var rows = collection.rows;
                        ctxt.presults[ctxt.selp] = d3.nest()
                                    .key(function(d) {return d.id_establecimiento;})
                                    .rollup(function(data) { return data[0]; })
                                    .map(rows);

                        // Get the extent of the data and store it for later use
                        ctxt.presults[ctxt.selp].extent = d3.extent(rows, function(r) {return r.votos;});
                        ctxt.presults[ctxt.selp].extent_diff = d3.extent(rows, function(r) {return r.diferencia;});
                        redraw_features();
                    });
                }
            }
            else {
                redraw_features();
            }
            
        }

        //Draw controls
        ctxt.map.addControl(draw.drawControlFull);
        //Draw control
        ctxt.map.addLayer(draw.drawnItems);

        ctxt.map.on('draw:drawstart', draw.drawstart);
        ctxt.map.on('draw:drawstop', draw.drawstop);
        ctxt.map.on('draw:deleted', draw.drawdeleted);
        ctxt.map.on('draw:created', filter_draw);
        ctxt.map.on('draw:edited', filter_draw);

        if(helpers.check_location()){
            var id_establecimiento = helpers.check_location().replace("#id_", "");
            config.sql.execute(templates.permalink_sql,{id_establecimiento: id_establecimiento})
            .done(function(data) {
                var position = JSON.parse(data.rows[0].g).coordinates;
                var latlng = L.latLng(position[1], position[0]);
                var d = data.rows[0];
                ctxt.map.setView(latlng, 14);
                d3featureClick({properties: d},null,latlng);
            });
        }
        // Add explanation for the drawing plugin
        $("div#instructivo").fadeIn(200);

        //Winner data
        $("div#home").click(function(){
            ctxt.selp = null;
            update_map();
        });

        //Test diff viz
        $("div#pro").click(function(){
            ctxt.selp = 18;
            update_map();
        });

        $("div#eco").click(function(){
            ctxt.selp = 16;
            update_map();
        });

        $("div#fpv").click(function(){
            ctxt.selp = 23;
            update_map();
        });

        $("div#fit").click(function(){
            ctxt.selp = 17;
            update_map();
        });

        $("div#ayl").click(function(){
            ctxt.selp = 81;
            update_map();
        });
    });
  });
});
