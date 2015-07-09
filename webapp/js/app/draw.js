define(['draw', 'app/config', 'app/context'], function (dummy, config, ctxt) {

    //Draw texts
    L.drawLocal.draw.toolbar.buttons.polygon = 'Dibujar un polígono';
    L.drawLocal.draw.toolbar.buttons.rectangle = 'Dibujar un rectángulo';
    L.drawLocal.draw.toolbar.actions.title = 'Cancelar selección';
    L.drawLocal.draw.toolbar.actions.text = 'Cancelar';
    L.drawLocal.draw.toolbar.undo.title = 'Borrar el último punto pintado';
    L.drawLocal.draw.toolbar.undo.text = 'Borrar último punto';
    L.drawLocal.draw.handlers.polygon.tooltip.start = 'Clickear para marcar el punto inicial';
    L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Clickear para ir creando puntos';
    L.drawLocal.draw.handlers.polygon.tooltip.end = 'Clickear en el primer punto para cerrar la forma';
    L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Clickear y arrastrar para crear el rectángulo';
    L.drawLocal.draw.handlers.simpleshape.tooltip.end = 'Soltá el mouse para finalizar la selección';
    L.drawLocal.edit.toolbar.actions.save.title = 'Aplicar cambios';
    L.drawLocal.edit.toolbar.actions.save.text = 'Aplicar';
    L.drawLocal.edit.toolbar.actions.cancel.title = 'Cancelar los cambios';
    L.drawLocal.edit.toolbar.actions.cancel.text = 'Cancelar';
    L.drawLocal.edit.toolbar.buttons.edit = 'Editar selección';
    L.drawLocal.edit.toolbar.buttons.editDisabled = 'No hay elementos que editar';
    L.drawLocal.edit.toolbar.buttons.remove = 'Borrar selección';
    L.drawLocal.edit.toolbar.buttons.removeDisabled = 'No hay elementos que borrar';
    L.drawLocal.edit.handlers.remove.tooltip.text = 'Clickear en la región seleccionada para borrar</br> luego APLICAR';
    L.drawLocal.edit.handlers.edit.tooltip.text = 'Clickear CANCELAR para descartar los cambios';
    L.drawLocal.edit.handlers.edit.tooltip.subtext = 'Arrastrar los vértices para modificar la selección</br> luego APLICAR';

    var drawnItems = new L.FeatureGroup();
    var drawControlFull = new L.Control.Draw({
        draw: {
            polyline: false,
            polygon: {
                allowIntersection: false,
                showArea: false,
                drawError: {
                    color: '#b00b00',
                    timeout: 1000
                },
                shapeOptions: {
                    color: '#555555'
                }
            },
            circle: false,
            rectangle: {
                shapeOptions: {
                    color: '#555555'
                }
            },
            marker: false
        },
        edit: {
            featureGroup: drawnItems,
            edit: false,
            remove: false
        }
    });

    var drawControlEditOnly = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            edit: true
        },
        draw: false
    });

    //Events
    function drawstart(e) {
        // Hide draw functionality explanation
        if ($('div#instructivo').is(":visible")) {
            $('div#instructivo').fadeOut(200); 
        }
    }

    function drawstop(e) {
        if (!drawnItems.getLayers().length) {
            $('svg.leaflet-zoom-animated').css('pointer-events','none');
        }
    }

    return {
        drawnItems: drawnItems,
        drawControlFull: drawControlFull,
        drawControlEditOnly: drawControlEditOnly,
        drawstart: drawstart,
        drawstop: drawstop
    };
});