define({
    check_location: function() {return location.hash;},
    close_slide: function() {
        $('#results').animate({right:'-50%'},'fast', function(){
            $('#results').html('');
            $('.leaflet-popup-pane *').hide();
            location.hash = '';
        });
    },
    animate_barras: function() {
        $("#results .cont_barra .barra").each(function(i, el){
            var $el = $(this);
            $el.delay(500).animate({width: $el.data("width")}, {duration: 900, queue:false});
        });
    }
});