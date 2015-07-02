define({
    CANDIDATOS_COLORES: {
        422: "#C5C8CB", // RAMIRO VASENA
        445: "#1796D7", // ANIBAL IBARRA
        448: "#7CC374", // MARIA GRACIELA OCAÑA
        640: "#FEDB30", // HORACIO ANTONIO RODRIGUEZ LARRETA "#FEDB30"
        687: "#1796D7", // GUSTAVO LOPEZ
        863: "#C5C8CB", // MANUELA CASTAÑEIRA
        943: "#1796D7", // GABRIELA CERRUTI
        1077: "#DD9636", // GABRIELA MICHETTI "#feb24c"
        1333: "#F4987E", // "HECTOR ""CACHO"" BIDONDE"
        1334: "#F4987E", // SERGIO GARCIA
        1335: "#F4987E", // """MARU"" LOPES"
        1402: "#C5C8CB", // LEONARDO RUBEN FABRE
        1690: "#1796D7", // VICTOR JORGE RAMOS
        1794: "#C5C8CB", // HUMBERTO MIGUEL TUMINI
        1881: "#7CC374", // ANDRES BORTHAGARAY
        2012: "#7CC374", // MARTIN LOUSTEAU
        2058: "#C5C8CB", // CARLOS HELLER
        2071: "#C5C8CB", // CLAUDIO RAUL LOZANO
        2312: "#C5C8CB", // ENRIQUE ADALBERTO PIRAGINI
        2346: "#C5C8CB", // GUSTAVO JAVIER VERA
        2474: "#C5C8CB", // GUSTAVO TENAGLIA
        2616: "#C5C8CB", // PABLO RICARDO FERREYRA
        2729: "#C5C8CB", // MYRIAM BREGMAN
        2764: "#C5C8CB", // SERGIO ABREVAYA
        3236: "#C5C8CB", // LUIS FERNANDO ZAMORA
        3277: "#F4987E", // MARTIN TORRES
        4228: "#C5C8CB", // IVO CUTZARIDA
        4238: "#D6BBEA", // GUILLERMO EMILIO NIELSEN
        4440: "#1796D7", // MARIANO RECALDE
        4636: "#1796D7", // CARLOS GUSTAVO OVIEDO
        9999: "#aaaaaa"
    },
    ZOOM_MULTIPLIERS: {
        12: .35,
        13: 0.7,
        14: 1.2,
        15: 1.35,
        16: 1.5
    },
    carto_layers:{ '2015_caba_paso': null},
    CARTODB_USER: 'lndata',
    sql: null,
    //JET: Cartodb SQL template
    LAYER_SQL: "SELECT * FROM cache_votos_paso_2015_cand order by (margin_victory / sqrt_positivos) desc",
    distritos: null,
    dicc_candidatos: null,
    cdn_proxy: "http://olcreativa.lanacion.com.ar/dev/get_url/img.php?img=",
    ancho: null,
    alto: null,
    google_url: "https://plus.google.com/share?url=http://www.lanacion.com.ar/1788681-como-fueron-los-resultados-de-las-paso-en-la-escuela-donde-votaste",
    twitter_url: "http://twitter.com/share?text=Este es el resultado de la mesa en la que voté&url=http://www.lanacion.com.ar/1788681-como-fueron-los-resultados-de-las-paso-en-la-escuela-donde-votaste&hashtags=lanacioncom,elecciones2015",
    facebook_url: "https://www.facebook.com/sharer/sharer.php?u=www.lanacion.com.ar/1788681-como-fueron-los-resultados-de-las-paso-en-la-escuela-donde-votaste"

});