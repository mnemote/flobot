$(function () {

    function max(numbers) {
        return Math.max.apply(null, numbers);
    }

    function sum(numbers) {
        return numbers.reduce(function (a,b) { return a+b; }, 0);
    }

    var nodes = [ 
        {
            id: "LS1",
            label: "Line Sensor",
            inputs: [ ],
            outputs: [
                { label: "Left" },
                { label: "Center" },
                { label: "Right" }
            ],
            geometry: { x: 100, y: 100 }
        },
        {
            id: "MD1",
            label: "Motor Driver",
            inputs: [ { label: "Left"}, { label: "Right" } ],
            outputs: [ ],
            connect: [ "C1", "C2" ],
            geometry: { x: 300, y: 450 }
        },
        { 
            id: "C1",
            label: "compare",
            inputs: [ { label: "a" }, { label: "b" } ],
            connect: [ "LS1.Right", "LS1.Left" ],
            outputs: [ { label: "a-b" } ],
            geometry: { x: 100, y: 300 }
        },
        {
            id: "C2",
            label: "compare",
            inputs: [ { label: "a" }, { label: "b" } ],
            connect: [ "LS1.Right", "LS1.Left" ],
            outputs: [ { label: "a-b" } ],
            geometry: { x: 400, y: 200 }
        }
    ];

    function add_to_dom(node) {
        var xmlns = "http://www.w3.org/2000/svg";
        var svg = document.getElementById('svg');
        var group = document.createElementNS(xmlns, 'g');
        group.setAttribute('transform', 'translate(' + node.geometry.x + ',' + node.geometry.y + ')');
        group.setAttribute('y', 100);
        svg.appendChild(group);

        var rect = document.createElementNS(xmlns, 'rect');
        rect.setAttribute('stroke', '#000');
        rect.setAttribute('fill', '#EEC');
        group.appendChild(rect);
        
        var strings = [ 
            node.inputs.map(function (x) { return x.label }),
            [ node.label ],
            node.outputs.map(function (x) { return x.label })
        ].filter(function (ss) { return ss.length > 0 });

        var texts = strings.map(function (ss) { 
            return ss.map(function (s) {
                var text = document.createElementNS(xmlns, 'text');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('alignment-baseline', 'middle');
                text.textContent = s;
                group.appendChild(text);
                return text;
            });
        });

        var line_height = max(texts.map(function (ts) {
            return ts.length ? max(ts.map(function (t) { return t.getBBox().height + 5; })) : 0; 
        }));

        var max_widths = texts.map(function (ts) {
            return ts.length ? max(ts.map(function (t) { return t.getBBox().width + 10; })) : 0;
        });
        var width = max(max_widths.map(function(w, i) { return w * texts[i].length }));

        rect.setAttribute('width', width);
        rect.setAttribute('height', line_height * texts.length);
        
        texts.forEach(function (ts, i) {
            ts.forEach(function (t, j) {
                t.setAttribute('x', (width / ts.length / 2) * (2 * j + 1));
                t.setAttribute('y', (i+0.5) * line_height);
            });
        });
    }

/*
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
            nodes.push({ name: '[ ' + nodes.length + ' ]', geometry: { x: e.pageX, y: e.pageY, w: 100, h: 40 }});
        }
        e.preventDefault();
    });
*/

    nodes.forEach(add_to_dom);

});
