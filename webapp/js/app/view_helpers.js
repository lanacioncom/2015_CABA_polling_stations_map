define(function () {
    //Formatting helper
    Number.prototype.format = function(c, d, t){
        var n = this;
        c = isNaN(c = Math.abs(c)) ? 2 : c;
        d = d === undefined ? "," : d;
        t = t === undefined ? "." : t;
        var s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
        var nn = s + (j ? i.substr(0, j) + t : "") + 
                     i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
                     (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
        return nn;
    };
    return {
        get_candidato_apellido_class: function(d,dict) {
            return dict[d.id_candidato] ? dict[d.id_candidato].foto.toLowerCase() : "";
        },
        get_candidato_nombre: function(d,dict) {
            return dict[d.id_candidato] ? dict[d.id_candidato].nombre_completo : "";
        },
        get_candidato_color: function(d,dict) {
            return dict[d.id_candidato] ? dict[d.id_candidato].color_candidato : "";
        },
        get_formatted_pct: function(num,den,c,d,t) {
            return ((+num / +den)*100).format(c, d, t);
        },
        get_formatted_num: function(num,c,d,t) {
            return (+num).format(c, d, t);
        }
    };
});