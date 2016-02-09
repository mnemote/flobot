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

    nodes.forEach(function (node) { node.geometry.w = 10; node.geometry.h = 10; });
    
    var ractive = new Ractive({
        template: '#template',
        el: '#main',
        data: { nodes: nodes },
        magic: true
    });

    $('text.node').each(function (n, x) {
        var geometry = nodes[$(x).data('node-index')].geometry;
        geometry.w = x.clientWidth + 20;
        geometry.h = x.clientHeight + 20;
    });
    ractive.update();

    var selected_node_index = null;
    var offset_x;
    var offset_y;
    $('#main').on('mousedown', '.node', function (e) {
        selected_node_index = $(this).data('node-index');
        $('*[data-node-index~=' + selected_node_index + ']').addClass('drag');
        var geometry = nodes[selected_node_index].geometry;
        offset_x = geometry.x - e.pageX;
        offset_y = geometry.y - e.pageY;
        e.preventDefault();
    }).on('mouseup mouseleave', function (e) {
        if (selected_node_index !== null) {
            $('.drag').removeClass('drag');
            setTimeout(function () { selected_node_index = null; }, 100);
            e.preventDefault();
        }
    }).on('mousemove', function (e) {
        if (selected_node_index !== null) {
            var geometry = nodes[selected_node_index].geometry;
            geometry.x = offset_x + e.pageX;
            geometry.y = offset_y + e.pageY;
            e.preventDefault();
        }
    }).on('click', function (e) {
        if (selected_node_index === null) {
            nodes.push({ name: 'whatever', geometry: { x: e.pageX, y: e.pageY, w: 100, h: 40 }});
        }
        e.preventDefault();
    });
});
