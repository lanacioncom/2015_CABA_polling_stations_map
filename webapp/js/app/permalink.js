define(['app/context'], function(context){

    function set(){
        var ctxt = JSON.stringify(context);
        ctxt = ctxt.replace(/\"|\{|\}/g, '').replace(/,/g, "&").replace(/:/g, "=")
        location.hash = ctxt;
    }

    function get(){
        var u = location.hash.replace("#", "");
        if(u){
            u = u.split(/\&/);
            u.forEach(function(c, i){
                c = c.split("=");
                context[c[0]] = eval(c[1]);
            });
        }
    }

    return {
        get: get,
        set: set
    };
});