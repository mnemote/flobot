$(function () {

    var nodes = [ 
                { 
                    name: "Hello",
                    geometry: { x: 100, y: 100 }
                },
                {
                    name: "World",
                    geometry: { x: 300, y: 50 }
                },
                { 
                    name: "Fnord",
                    geometry: { x: 100, y: 300 }
                },
                {
                    name: "Supercalifragilisticexpialidocious",
                    geometry: { x: 400, y: 200 }
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
    $('#main').on('mousedown', 'circle.node,text.node', function (e) {
        selected_node_index = $(this).data('node-index');
        previous_pagex = e.pageX;
        previous_pagey = e.pageY;
        e.preventDefault();
    }).on('mouseup mouseleave', function (e) {
        selected_node_index = null;
    }).on('mousemove', function (e) {
        if (selected_node_index !== null) {
            var geometry = nodes[selected_node_index].geometry;
            geometry.x += e.pageX - previous_pagex;
            geometry.y += e.pageY - previous_pagey;
            previous_pagex = e.pageX;
            previous_pagey = e.pageY;
            e.preventDefault();
        }
    })
});
