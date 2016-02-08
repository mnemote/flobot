$(function () {

    var nodes = [ 
                { 
                    name: "Hello",
                    geometry: { x: 20, y: 30, w: 30, h: 50 }
                },
                {
                    name: "World",
                    geometry: { x: 60, y: 50, w: 20, h: 20 }
                },
                { 
                    name: "Fnord",
                    geometry: { x: 10, y: 10, w: 10, h: 10 }
                }
            ];

    var ractive = new Ractive({
        template: '#template',
        el: '#main',
        data: { nodes: nodes },
        magic: true
    });

    var selected_node_index = null;
    var previous_pagex;
    var previous_pagey;
    $('#main').on('mousedown', '.node', function (e) {
        selected_node_index = $(this).data('node-index');
        previous_pagex = e.pageX;
        previous_pagey = e.pageY;
    }).on('mouseup mouseleave', function (e) {
        selected_node_index = null;
    }).on('mousemove', function (e) {
        if (selected_node_index !== null) {
            var geometry = nodes[selected_node_index].geometry;
            geometry.x += e.pageX - previous_pagex;
            geometry.y += e.pageY - previous_pagey;
            previous_pagex = e.pageX;
            previous_pagey = e.pageY;
        }
    })
        /*var geometry = ractive.get('nodes.' + $(this).data('node-index') + '.geometry');
        var ox = geometry.x; var px = e.pageX;
        var oy = geometry.y; var py = e.pageY;
        $(this).on('mousemove', function (e) {
            geometry.x = ox + e.pageX - px;
            geometry.y = oy + e.pageY - py;
            ractive.set('nodes.' + $(this).data('node-index') + '.geometry', geometry);
        });
    });
    $('#main').on('mouseup mouseleave', '.node', function (e) {
        $(this).off('mousemove');
        $('body').on('mouseup', mouseup);
        function mouseup(e) {
            $(this).off('mousemove');
            $('body').off('mouseup', mouseup);
        };
    });*/
    
});
