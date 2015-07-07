requirejs.config({
    baseUrl: 'js',
    paths: {
        'draw': '../libs/leaflet.draw',
        'templates': '../templates', 
        'text': '../libs/requirejs-text/text',
        'd3': '../libs/d3/d3.min',
    }
});

requirejs(['app/config', 'app/context', 'app/templates', 
           'app/helpers', 'app/view_helpers', 'app/draw', 'app/permalink', 
           'd3'],
function(config, ctxt, templates, helpers, view_helpers, draw, permalink, d3) {
    $(function() {
    "use strict";
        var map;
        // Template for the description of a given polling station
        var popup_tmpl = _.template(templates.popup);
        // Template to show error in case drawing does not intersect any polling station
        var popup_simple_tmpl = _.template(templates.popup_simple);
        // Template for the results of a given polling station
        var overlay_tmpl = _.template(templates.overlay);

        var transform = d3.geo.transform({point: projectPoint});
        var path = d3.geo.path().projection(transform).pointRadius(0);
        var presults = {};
        var features, arrows;
        var geom = null;

        //JET: Load sections 
        $.get("data/diccionario_datos.json", function(data){
            config.diccionario_datos = data;
        });

        // Set initial zoom level for responsiveness
        if ($("body").width() < 650) {
            config.current_zoomLevel = 11;
        }
        else {
            config.current_zoomLevel = 12;
        }
        
        map = L.map('mapa_cont', {
            center: [-34.61597432902992, -58.442115783691406],
            zoom: config.current_zoomLevel,
            minZoom: config.current_zoomLevel,
            maxZoom: 16,
            attributionControl: false,
        });

        //map.addLayer(config.street_base_layer);

        config.sql = new cartodb.SQL({
            user: config.CARTODB_USER
        });

        // Template that stores the query to execute once a polling station has been clicked
        var click_feature_tpl = _.template(templates.click_feature_sql);
        var click_feature_winner_tpl = _.template(templates.click_feature_winner_sql);

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
        map.on('dragend', function(e, x, y) {
            if (config.current_latlng !== null && !map.getBounds().contains(config.current_latlng)) {
                hideOverlay();
                map.closePopup();
            }
        });

        //config.street_base_layer.on("load",function() { console.log("all visible tiles of street have been loaded") });
        //config.street_base_layer.on("loading",function() { console.log("all visible tiles of party are loading") });

        // Close popup and overlay
        map.on('popupclose', function() {
            if (ctxt.featureClicked) ctxt.featureClicked = false;
            helpers.close_slide();
        });

        // D3 layer
        var svg = d3.select(map.getPanes().overlayPane)
                    .append("svg").attr("id", "d3layer");
        var g = svg.append("g").attr("class", "leaflet-zoom-hide");
        // Arrow tips
        svg.append("svg:defs").selectAll("marker")
                   .data(["18", "16", "23", "81", "17", "00"])
                   .enter().append("marker")
                   .attr("id", function(d) {return "a_"+d;})
                   .attr("viewBox", "0 -5 10 10")
                    .attr("refX", 0)
                    .attr("refY", 0)
                    .attr("markerWidth", 3)
                    .attr("markerHeight", 3)
                    .attr("orient", "auto")
                    .append("svg:path")
                    .attr("class", function(d) {return "arrow a"+d;})
                    .attr("d", "M0,-5L10,0L0,5");

        config.sql.execute(templates.d3_geom_sql,null,{format: 'GeoJSON'})
        .done(function(collection) {
            // store geoJSON in context
            geom = collection;

            features = g.selectAll("path.establecimiento")
                            .data(collection.features, function(d) {return d.properties.id_establecimiento;});

            //Create the polling tables circles
            features.enter()
                    .append("path")
                    .attr("class", "establecimiento")
                    .attr('id', function(d) {return "id"+d.properties.id_establecimiento;})
                    .on('click', d3featureClick);

            //Create the polling stations arrows
            arrows = g.selectAll("line.arrow")
                            .data(collection.features, function(d) {return d.properties.id_establecimiento;});
            
            arrows.enter()
                 .append("line")
                 .attr("class","arrow disabled")
                 .attr("x1", function (d) {return path.centroid(d)[0];})
                 .attr("y1", function (d) {return path.centroid(d)[1];})
                 .attr("x2", function (d) {return path.centroid(d)[0];})
                 .attr("y2", function (d) {return path.centroid(d)[1];});

            map.on("viewreset", reset);
            reset();

            //Get context from permalink
            permalink.get();
            //We need to check the permalink
            update_map();
        });

        // Reposition the SVG to cover the features.
        function reset() {
            config.current_zoomLevel = map.getZoom();
            var bounds = path.bounds(geom),
                         topLeft = bounds[0],
                         bottomRight = bounds[1];
            // We need to give some padding because of the path pointRadius
            var padding = 30;
            topLeft = [topLeft[0]-padding, topLeft[1]-padding];

            svg.attr("width", bottomRight[0] - topLeft[0]+padding)
               .attr("height", bottomRight[1] - topLeft[1]+padding)
               .style("left", topLeft[0] + "px")
               .style("top", topLeft[1]+ "px");

            g.attr("transform", "translate(" + (-topLeft[0]) + "," + (-topLeft[1]) + ")");
            if (!(_.isEmpty(presults))) {
                features.attr("d", path).style("fill", set_circle_color);
                reposition_arrows();
            }
        }

        // Use Leaflet to implement a D3 geometric transformation.
        function projectPoint(x, y) {
            /*jshint validthis: true */
            var point = map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

        function set_circle_radius(d) {
            var r = null;
            var pid = null;
            var fid = d.properties.id_establecimiento;
            if (!ctxt.selected_party) {
                pid = "winner";
            }
            else {
                pid = ctxt.selected_party;
            }
            var pos = d.properties.positivos;
            var v = presults[pid][fid].votos / pos;
            var min = presults[pid].extent[0] / pos;
            var max = presults[pid].extent[1] / pos;
            // Quadratic Party extent
            //var s = d3.scale.sqrt().domain([min,max]).range([2,12]);
            // Linear Party extent
            //var s = d3.scale.linear().domain([min,max]).range([2,12]);
            // Quadratic Party max
            //var s = d3.scale.sqrt().domain([0,max]).range([2,12]);
            // Linear Party max
            //var s = d3.scale.linear().domain([0,max]).range([2,12]);
            // Quadratic Total percentage
            //var s = d3.scale.sqrt().domain([0,1]).range([2,12]);
            // Linear Total percentage
            var s = d3.scale.linear().domain([0,1]).range([2,12]);
            //console.log("v: "+v);
            //console.log("scaled: "+s(v));
            return s(v);
        }

        function set_circle_color(d) {
            var r = null;
            if (ctxt.selected_party == "00") {
                var fid = d.properties.id_establecimiento;
                var pid = presults[ctxt.selected_party][fid].id_partido;
                r = config.diccionario_datos[pid].color_partido;
            }
            else {
                r = config.diccionario_datos[ctxt.selected_party].color_partido;
            }
            return r;
        }

        function switch_base_layers() {
            if (ctxt.selected_party == "00") {
                if (map.hasLayer(config.party_base_layer)) {
                    map.removeLayer(config.party_base_layer);
                } 
                if (!map.hasLayer(config.street_base_layer)) {
                    map.addLayer(config.street_base_layer);
                }
            }
            else {
                if (map.hasLayer(config.street_base_layer)) {
                    map.removeLayer(config.street_base_layer);
                }
                if (!map.hasLayer(config.party_base_layer)) {
                    map.addLayer(config.party_base_layer);
                }
            }
        }

        function redraw_map() {
            map.scrollWheelZoom.disable();
            switch_base_layers();
            if (ctxt.show_diff) {
                g.selectAll("path.establecimiento")
                    .attr("d",path.pointRadius(3))
                    .style("fill", set_circle_color);
                g.selectAll("line.arrow").classed("disabled", false);
                g.selectAll("line.arrow")
                .attr("x1", function (d) {return path.centroid(d)[0];})
                .attr("y1", function (d) {return path.centroid(d)[1];})
                .attr("x2", function (d) {return path.centroid(d)[0];})
                .attr("marker-end",set_arrow_marker_end)
                .style("stroke", set_arrow_color)
                .transition().ease("quad-in-out")
                .duration(1000)
                .attr("y2", set_arrow_length);
            }else {
                g.selectAll("line.arrow")
                    .classed("disabled", true)
                    .attr("marker-end","none")
                    .attr("y2", reset_arrow_length);
                //g.selectAll("path.establecimiento").classed("disabled", false);
                g.selectAll("path").transition().ease("quad-in-out").duration(1000)
                 .attr("d",path.pointRadius(set_circle_radius))
                 .style("fill", set_circle_color);

                if (ctxt.selected_polling) {
                    var id_establecimiento = ctxt.selected_polling;
                    config.sql.execute(templates.permalink_sql,{id_establecimiento: id_establecimiento})
                    .done(function(data) {
                        var position = JSON.parse(data.rows[0].g).coordinates;
                        var latlng = L.latLng(position[1], position[0]);
                        var d = data.rows[0];
                        map.panTo(latlng);
                        d3featureClick({properties: d},null,latlng);
                    });
                }
            }
        }

        function reposition_arrows(d,i) {
            g.selectAll("line.arrow")
                .attr("x1", function (d) {return path.centroid(d)[0];})
                .attr("y1", function (d) {return path.centroid(d)[1];})
                .attr("x2", function (d) {return path.centroid(d)[0];})
                .attr("y2", set_arrow_length);
        }

        function check_available_data() {
            var p = ctxt.selected_party;
            if (!ctxt.selected_party) {
                ctxt.selected_party = "00";
                p = "00";
            }
            if(p in presults) {
                return true;
            }
            return false;
        }

        function set_arrow_marker_end(d) {
            var r = null;
            var pid = null;
            var fid = d.properties.id_establecimiento;
            if (!ctxt.selected_party) {
                pid = "00";
            }
            else {
                pid = ctxt.selected_party;
            }
            var v = presults[pid][fid].diferencia;
            if (v > 0) {
                r = "url(#a_"+ctxt.selected_party+")";
            }
            else {
                r = "url(#a_00)";
            }
            return r;
        }

        function set_arrow_length(d,i) {
            var r = null;
            var center = path.centroid(d);
            var pid = null;
            var fid = d.properties.id_establecimiento;
            if (!ctxt.selected_party) {
                pid = "winner";
            }
            else {
                pid = ctxt.selected_party;
            }
            var v = presults[pid][fid].diferencia;
            var max = presults[pid].max_diff;
            //var s = d3.scale.linear().domain([0,max]).range([5,20]);
            var s = d3.scale.linear().domain([0,673]).range([1,40]);
            var offset = parseInt(s(Math.abs(v)));
            if (v > 0) {
                offset = -offset;
            }
            r = center[1]+offset;
            return r;
        }

        function set_arrow_color(d) {
            var r = null;
            var pid = null;
            var fid = d.properties.id_establecimiento;
            if (!ctxt.selected_party) {
                pid = "winner";
            }
            else {
                pid = ctxt.selected_party;
            }
            var v = presults[pid][fid].diferencia;
            if (v > 0) {
                r = config.diccionario_datos[ctxt.selected_party].color_partido;
                //r = "#000000";
            } 
            else {
                r = "#000000";
            }
            return r;
        }

        function reset_arrow_length(d,i) {
            var r = null;
            var center = path.centroid(d);
            return center[1];
        }

        function update_map() {
            if (!check_available_data()) {
                // from here http://stackoverflow.com/questions/3800551/select-first-row-in-each-group-by-group
                var query, data;
                if (ctxt.selected_party == "00") {
                    query = templates.d3_winner_sql;
                    data = {};
                }else {
                    query = templates.d3_diff_sql;
                    data = {id_partido: ctxt.selected_party};
                }
                
                config.sql.execute(query, data)
                .done(function(collection) {
                    var rows = collection.rows;
                    presults[ctxt.selected_party] = d3.nest()
                                                 .key(function(d) {return d.id_establecimiento;})
                                                 .rollup(function(data) { return data[0]; })
                                                 .map(rows);

                    // Get the extent of the data and store it for later use
                    presults[ctxt.selected_party].extent = d3.extent(rows, function(r) {return r.votos;});
                    presults[ctxt.selected_party].max_diff = d3.max(rows, function(r) {return Math.abs(r.diferencia);});
                    permalink.set();
                    redraw_map();
                });
            } else {
                permalink.set();
                redraw_map();
            }        
        }

        //Draw controls
        map.addControl(draw.drawControlFull);
        //Draw control
        map.addLayer(draw.drawnItems);

        map.on('draw:drawstart', draw.drawstart);
        map.on('draw:drawstop', draw.drawstop);
        map.on('draw:deleted', draw_deleted);
        map.on('draw:created', draw_filter);
        map.on('draw:edited', draw_filter);

        //Winner data
        d3.select("div#home").on('click', function(){
            // To hide filters if we are on mobile
            d3.select("nav").classed("muestra", true);
            ctxt.selected_party = "00";
            ctxt.selected_polling = null;
            ctxt.show_diff = false;
            permalink.set();
            update_map();
            return false;
        });

        //Test diff viz
        d3.selectAll(".set_status_app").on('click', set_status_app);
        function set_status_app(){
        /*jshint validthis: true */
            // To hide filters if we are on mobile
            if (!this.classList.contains("active")) {
                d3.select("button.active").classed("active", false);
                d3.select(this).classed("active", true);
                ctxt.show_diff = this.classList.contains("paso");
                ctxt.selected_party = this.dataset.partido;
                update_map();
                d3.select("div#instructivo").remove();
            }
            return false;
        }

        /** DRAW FUNCTIONALITY */

        function draw_deleted(e) {
            if (!draw.drawnItems.getLayers().length) {
                draw.drawControlEditOnly.removeFrom(map);
                draw.drawControlFull.addTo(map);
                $('svg.leaflet-zoom-animated').css('pointer-events','none');
            }
        }

        function draw_filter(e) {
            var draw_layer, latlng = null;
            if (e.type === "draw:created") {
                draw_layer = e.layer;
                latlng = draw_layer.getBounds().getCenter(); 
                draw.drawnItems.addLayer(draw_layer);
                draw.drawControlFull.removeFrom(map);
                draw.drawControlEditOnly.addTo(map);
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
            map.panTo(latlng);
            config.sql.execute(templates.draw1_sql,{bounds: sql_poly.join()})
            .done(function(data) {
                // Check to see if there's any intersection
                if (data.total_rows) { 
                    var establecimiento_data = {descripcion: "SELECCIÓN"};
                    var ids = [];
                    var d = data.rows;
                    d.forEach(function(d) {
                        ids.push(d.id_establecimiento);
                    });
                    establecimiento_data.electores = _.reduce(d, function(m,e) { return m + e.electores; }, 0);
                    establecimiento_data.votantes = _.reduce(d, function(m,e) { return m + e.votantes; }, 0);
                    establecimiento_data.positivos = _.reduce(d, function(m,e) { return m + e.positivos; }, 0);
                    if (ctxt.selected_party != "00") {
                        config.sql.execute(templates.draw2_sql,{ids: ids.join(), 
                                                                id_partido: ctxt.selected_party})
                        .done(_.partial(featureClickDone, latlng, establecimiento_data));
                    }
                    else {
                        config.sql.execute(templates.draw2_winner_sql,{ids: ids.join()})
                        .done(_.partial(featureClickDone, latlng, establecimiento_data))
                        .error(function(errors) {
                            console.log(errors);
                        });
                    }
                }
                else {
                    var msg_header = "Error";
                    var msg_body = "No se ha encontrado ningún establecimiento con la selección actual";
                    var popup = L.popup()
                        .setLatLng(latlng)
                        .setContent(popup_simple_tmpl({message_header: msg_header,
                                        message_body: msg_body}))
                        .openOn(map);
                }
            });
        }

        /** FEATURE CLICK FUNCTIONALITY */

        // Get data for the clicked polling station and show popup and overlay
        function d3featureClick(d, i, latlng) {
            if ($('div#instructivo').is(":visible")) {
                $('div#instructivo').fadeOut(200); 
            }
            $('#overlay *').fadeOut(200, function() { $(this).remove();});
            showOverlay();
            if (!latlng) {
                latlng = L.latLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
            }
            config.current_latlng = latlng;
            map.panTo(latlng);
            setTimeout(function() {
                var fid = d.properties.id_establecimiento;
                var query;
                var data;
                if (ctxt.selected_party == "00") {
                    query = templates.click_feature_winner_sql;
                    data = {id_establecimiento: fid};
                }else {
                    query = templates.click_feature_sql;
                    data = {id_establecimiento: fid,
                            id_partido: ctxt.selected_party};
                }
                config.sql.execute(query, data)
                    .done(_.partial(featureClickDone, latlng, d.properties))
                    .error(function(errors) {
                        // errors contains a list of errors
                        console.log(errors);
                    });
            }, 200);
        }

        //Called when the Cartodb SQL has finished
        function featureClickDone(latlng, establecimiento_data, votos_data) {
            var popup = null;

            /** If we are viewing differences ignore overlay */
            if (ctxt.selected_party != "00") {
                popup = L.popup()
                    .setLatLng(latlng)
                    .setContent(popup_tmpl({establecimiento: establecimiento_data,
                                            winner: false,
                                            v: votos_data,
                                            dict_datos: config.diccionario_datos,
                                            vh: view_helpers}))
                    .openOn(map);
                return false;
            }

            var d = votos_data.rows;
            d.forEach(function(d) {
                d.pct = (d.votos / establecimiento_data.positivos) * 100;
            });
            popup = L.popup()
                .setLatLng(latlng)
                .setContent(popup_tmpl({establecimiento: establecimiento_data,
                                        winner: true,
                                        v: votos_data,
                                        dict_datos: config.diccionario_datos}))
                .openOn(map); 
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

            if (ctxt.selected_polling != establecimiento_data.id_establecimiento) {
                ctxt.selected_polling = establecimiento_data.id_establecimiento;
            }

            //Finally update permalink
            permalink.set(); 
        }

        //Hide filter buttons for mobile
        d3.select("div#hamburguesa").click(function(){
            d3.select("nav").classed("muestra", true);
            return false;
        });
    });
});
