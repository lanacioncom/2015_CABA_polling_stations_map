define([], function() {

    var cdn_proxy = "http://olcreativa.lanacion.com.ar/dev/get_url/img.php?img=";
    //var mapboxUrl = cdn_proxy+'https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}';
    var mapboxUrl = 'https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}';

    return {
    zoom_arrow_multipliers: {
        11: 1,
        12: 1,
        13: 1,
        14: 2,
        15: 4,
        16: 8
    },
    zoom_radius: {
        11: 2,
        12: 2.5,
        13: 3,
        14: 3.5,
        15: 4,
        16: 5
    },
    carto_layers:{ '2015_caba': null},
    CARTODB_USER: 'lndata',
    sql: null,
    diccionario_datos: null,
    current_latlng: null,
    current_zoomLevel: null,
    featureClicked: false,
    map: null,
    base_layer: L.tileLayer(mapboxUrl, {
                                        id: 'olcreativa.mle7fnoa',  
                                        attribution: "OpenStreetMaps", 
                                        token: 'pk.eyJ1Ijoib2xjcmVhdGl2YSIsImEiOiJEZWUxUmpzIn0.buFJd1-sVkgR01epcQz4Iw'})
    };
});