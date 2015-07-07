define([], function() {

    var cdn_proxy = "http://olcreativa.lanacion.com.ar/dev/get_url/img.php?img=";
    var mapboxUrl = cdn_proxy+'https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}';
    //var mapboxUrl = 'https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}';

    return {
    ZOOM_MULTIPLIERS: {
        12: .35,
        13: 0.7,
        14: 1.2,
        15: 1.35,
        16: 1.5
    },
    carto_layers:{ '2015_caba': null},
    CARTODB_USER: 'lndata',
    sql: null,
    diccionario_datos: null,
    current_latlng: null,
    current_zoomLevel: null,
    featureClicked: false,
    map: null,
    street_base_layer: L.tileLayer(mapboxUrl, {
                                                id: 'olcreativa.c409ba3f',
                                                attribution: "OpenStreetMaps", 
                                                token: 'pk.eyJ1Ijoib2xjcmVhdGl2YSIsImEiOiJEZWUxUmpzIn0.buFJd1-sVkgR01epcQz4Iw'}),
    party_base_layer: L.tileLayer(mapboxUrl, {
                                                id: 'olcreativa.bd1c1a65',  
                                                attribution: "OpenStreetMaps", 
                                                token: 'pk.eyJ1Ijoib2xjcmVhdGl2YSIsImEiOiJEZWUxUmpzIn0.buFJd1-sVkgR01epcQz4Iw'})
    };
});