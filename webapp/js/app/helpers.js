define(['app/context', 'app/permalink', 'app/config'], function(ctxt, permalink, config) {

    return {
        close_slide: function() {
            $('#results').animate({right:'-50%'},'fast', function(){
                $('#results').html('');
                if (config.screen_width > 550) {
                    $('.leaflet-popup-pane *').hide();
                }
            });
        },
        animate_barras: function() {
            $("#results .cont_barra .barra").each(function(i, el){
                var $el = $(this);
                $el.delay(500).animate({width: $el.data("width")}, {duration: 900, queue:false});
            });
        }
    };
});