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
    var offset_x;
    var offset_y;
    $('#main').on('mousedown', 'circle.node,text.node', function (e) {
        selected_node_index = $(this).data('node-index');
        var geometry = nodes[selected_node_index].geometry;
        offset_x = geometry.x - e.pageX;
        offset_y = geometry.y - e.pageY;
        e.preventDefault();
    }).on('mouseup mouseleave', function (e) {
        if (selected_node_index !== null) {
            selected_node_index = null;
            e.preventDefault();
        }
    }).on('mousemove', function (e) {
        if (selected_node_index !== null) {
            var geometry = nodes[selected_node_index].geometry;
            geometry.x = offset_x + e.pageX;
            geometry.y = offset_y + e.pageY;
            e.preventDefault();
        }
    })
});
