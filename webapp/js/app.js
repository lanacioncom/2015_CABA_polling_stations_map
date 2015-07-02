requirejs.config({
    baseUrl: 'js',
    paths: {
        'draw': '../libs/leaflet.draw',
        'templates': '../templates', 
        'text': '../libs/plugins/text',
        'd3': '../libs/d3.min',
    }
});

requirejs(['app/config', 'app/state', 'app/templates', 
           'app/helpers', 'app/view_helpers', 'app/draw','d3'],
function(config, state, templates, helpers, view_helpers, draw, d3) {
  $(function() {
    "use strict";
    //JET: Load sections
    $.get("data/comunas.json", function(comunas) {
      config.distritos = comunas;
      //JET: Load parties dictionary 
      $.get("data/diccionario_candidatos.json", function(data){
        config.dicc_candidatos = data;
      });
    });

    config.ancho = $(window).width();
    config.alto = $(window).height();

    $(window).resize(function() {
        config.ancho = $(window).width();
        config.alto = $(window).height();
    });

    //JET: Initial zoom level
    state.current_zoomLevel = 12;

    state.map = L.map('mapa_cont', {
        center: [-34.61597432902992, -58.442115783691406],
        zoom: state.current_zoomLevel,
        minZoom: 12,
        maxZoom: 16,
        attributionControl: false,
    });

    var mapboxUrl = config.cdn_proxy+'https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}';
    //L.tileLayer(mapboxUrl, {attribution: "OpenStreetMaps"}).addTo(state.map);
    L.tileLayer(mapboxUrl, {
                            id: 'olcreativa.c409ba3f', 
                            attribution: "OpenStreetMaps", 
                            token: 'pk.eyJ1Ijoib2xjcmVhdGl2YSIsImEiOiJEZWUxUmpzIn0.buFJd1-sVkgR01epcQz4Iw'}).addTo(state.map);

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
    state.map.on('dragend', function(e, x, y) {
        if (state.current_latlng !== null && !state.map.getBounds().contains(state.current_latlng)) {
            hideOverlay();
            state.map.closePopup();
        }
    });

    // Close popup and overlay
    state.map.on('popupclose', function() {
        if (state.featureClicked) state.featureClicked = false;
        helpers.close_slide();
    });

    var featureOver = function(e, latlng, pos, data, layerNumber) {
        $('#mapa_cont').css('cursor', 'pointer');
    };

    var featureOut = function(e, layer) {
        $('#mapa_cont').css('cursor', 'auto');
    };

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
        state.current_latlng = latlng;
        state.map.panTo(latlng);
        setTimeout(function() {
            var query = FEATURE_CLICK_SQL_TMPL({
                establecimiento: d.properties
            });
            config.sql.execute(query)
                .done(_.partial(featureClickDone, latlng, d.properties, true))
                .error(function(errors) {
                  // errors contains a list of errors
                  console.log(errors)
                });
        }, 200);
    };

    //Called when the Cartodb SQL has finished
    var featureClickDone = function(latlng, establecimiento_data, unique, votos_data) {
        var popup = L.popup()
            .setLatLng(latlng)
            .setContent(popup_tmpl({establecimiento: establecimiento_data,
                                    v: votos_data,
                                    dict_candidatos: config.dicc_candidatos,
                                    unique: unique}))
            .openOn(state.map);
        
        var d = votos_data.rows;
        d.forEach(function(d) {
            d.pct = (d.votos / establecimiento_data.positivos) * 100;
        });

        $('#results').html(overlay_tmpl({
            e: establecimiento_data,
            data: d,
            dict_candidatos: config.dicc_candidatos,
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
            draw.drawControlFull.removeFrom(state.map);
            draw.drawControlEditOnly.addTo(state.map);
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
        state.map.panTo(latlng);
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
                    .openOn(state.map);
            }
        });
    };

    // D3 layer
    var svg = d3.select(state.map.getPanes().overlayPane)
                .append("svg").attr("id", "d3layer");
    var g = svg.append("g").attr("class", "leaflet-zoom-hide");

    config.sql.execute(templates.d3_sql,null,{format: 'GeoJSON'})
    .done(function(collection) {
        var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform).pointRadius(radius);

        var features = g.selectAll("path")
                        .data(collection.features)
                        .enter().append("path")
                        .attr('id', function(d) {return d.properties.id_establecimiento})
                        .on('click', d3featureClick)
                        .on('mouseover', d3featureOver)
                        .on('mouseout', d3featureOut);

        state.map.on("viewreset", reset);
        // Force first call to position the d3 layer features
        reset();

        // Reposition the SVG to cover the features.
        function reset() {
            state.current_zoomLevel = state.map.getZoom();
            var bounds = path.bounds(collection),
                         topLeft = bounds[0],
                         bottomRight = bounds[1];

            // We need to give some padding because of the path pointRadius
            var padding = 20;
            topLeft = [topLeft[0]-padding, topLeft[1]-padding]

            svg.attr("width", bottomRight[0] - topLeft[0]+padding)
               .attr("height", bottomRight[1] - topLeft[1]+padding)
               .style("left", topLeft[0] + "px")
               .style("top", topLeft[1]+ "px");

            g.attr("transform", "translate(" + (-topLeft[0]) + "," + (-topLeft[1]) + ")");
            features.attr("d", path)
                    .style("fill", winner);
        }

        // Use Leaflet to implement a D3 geometric transformation.
        function projectPoint(x, y) {
            var point = state.map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

        function radius(d) {
            var m = config.ZOOM_MULTIPLIERS[state.current_zoomLevel];
            var r = (2.5 + (d.properties.margin_victory / d.properties.sqrt_positivos) * m);
            return r;
        }

        function winner(d) {
            var r = config.CANDIDATOS_COLORES[d.properties.id_candidato];
            return r;
        }

        //Draw controls
        state.map.addControl(draw.drawControlFull);
        //Draw control
        state.map.addLayer(draw.drawnItems);

        state.map.on('draw:drawstart', draw.drawstart);
        state.map.on('draw:drawstop', draw.drawstop);
        state.map.on('draw:deleted', draw.drawdeleted);
        state.map.on('draw:created', filter_draw);
        state.map.on('draw:edited', filter_draw);

        if(helpers.check_location()){
            var id_establecimiento = helpers.check_location().replace("#id_", "");
            config.sql.execute(templates.permalink_sql,{id_establecimiento: id_establecimiento})
            .done(function(data) {
                var position = JSON.parse(data.rows[0].g).coordinates;
                var latlng = L.latLng(position[1], position[0]);
                var d = data.rows[0];
                state.map.setView(latlng, 14);
                d3featureClick({properties: d},null,latlng);
            });
        }
        // Add explanation for the drawing plugin
        $("div#instructivo").fadeIn(200);
    });
  });
});
