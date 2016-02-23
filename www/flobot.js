window.onload = function () {

    var svg_xmlns = "http://www.w3.org/2000/svg";
        
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
                { id: "L", label: "Left" },
                { id: "R", label: "Right" }
            ],
            geometry: { x: 100, y: 100 }
        },
        { 
            id: "LD1",
            label: "Light Sensor",
            inputs: [],
            outputs: [
                { id: "L", label: "Level"}
            ],
            geometry: { x: 600, y: 50 }
        },
        {
            id: "SUB1",
            label: "Subtract",
            inputs: [
                { id: "A", label: "A"},
                { id: "B", label: "B"},
            ],
            outputs: [ 
                { id: "S", label: "A-B"}
            ],
            connect: [ [ 0, 1 ], [1, 0] ],
            geometry: { x: 500, y: 200 }
        },
        {
            id: "MD1",
            label: "Motor Driver",
            inputs: [
                { id: "L", label: "Left" },
                { id: "R", label: "Right" }
            ],
            outputs: [ ],
            connect: [ [0,0], [2,0] ],
            geometry: { x: 300, y: 450 }
        }
    ];

    function DisplayEdge() {
        this.x1 = this.y1 = this.x2 = this.y2 = 0;
    }

    DisplayEdge.prototype.update_position = function () {
        var y3 = (this.y1 + this.y2) / 2;
        this.spline.setAttribute('d', 'M' + this.x1 + ' ' + this.y1 + 'C' + this.x1 + ' ' + y3 +
                                      ' ' + this.x2 + ' ' + y3 + ' ' + this.x2 + ' ' + this.y2);
    }

    DisplayEdge.prototype.update_src = function (x, y) {
        this.x1 = x; this.y1 = y; this.update_position();
    }

    DisplayEdge.prototype.update_dst = function (x, y) {
        this.x2 = x; this.y2 = y; this.update_position();
    }
    
    DisplayEdge.prototype.create_spline = function(svg_element) {
        this.spline = document.createElementNS(svg_xmlns, 'path');
        this.spline.setAttribute('class', 'edge');
        svg_element.appendChild(this.spline);
    }


    function DisplayNode(node) {
        this.node = node;
        this.edges_in = [];
        this.edges_out = [];
    }

    DisplayNode.prototype.update_position = function () {
        var x = this.node.geometry.x;
        var y = this.node.geometry.y;
        this.group.setAttribute('transform', 'translate(' + x + ',' + y + ')');
        this.edges_in.forEach(function (edge, n) {
            if (edge) {
                var x1 = this.node.geometry.x + (this.width / this.node.inputs.length / 2) * (n * 2 + 1);
                var y1 = this.node.geometry.y;
                edge.update_src(x1, y1);
            }
        }, this);
        this.edges_out.forEach(function (edge, n) {
            if (edge) {
                var x1 = this.node.geometry.x + (this.width / this.node.outputs.length / 2) * (n * 2 + 1);
                var y1 = this.node.geometry.y + this.height;
                edge.update_dst(x1, y1);
            }
        }, this);
    }

    DisplayNode.prototype.create_group = function (svg_element) {
        var self = this;
        this.group = document.createElementNS(svg_xmlns, 'g');
        svg_element.appendChild(this.group);
        this.group.addEventListener('mousedown', function (e) {
            self.group.parentNode.appendChild(self.group); // move to top
            self.drag_offset = [ self.node.geometry.x - e.screenX, self.node.geometry.y - e.screenY ]; 
            self.group.setAttribute('class', 'drag');
        });
        function end_drag() { self.drag_offset = null; self.group.setAttribute('class', ''); }
        this.group.addEventListener('mouseup', end_drag);
        this.group.addEventListener('mouseleave', end_drag);
        this.group.addEventListener('mousemove', function (e) {
            if (self.drag_offset) {
                self.node.geometry.x = self.drag_offset[0] + e.screenX;
                self.node.geometry.y = self.drag_offset[1] + e.screenY;
                self.update_position();
            } 
        });
    }

    DisplayNode.prototype.create_edges = function (svg_element) {
        if (!this.node.connect) return;
        this.node.connect.forEach(function (other_node_port, this_port) {
            if (other_node_port) {
                var other = display_nodes[other_node_port[0]];
                var other_port = other_node_port[1];
             
                var edge = new DisplayEdge();
                edge.create_spline(svg_element);
                this.edges_in[this_port] = edge;
                other.edges_out[other_port] = edge;
            }
        }, this);
        this.edges_out = this.node.outputs.map(function (output, n) {
            return null;
        });
    }

    DisplayNode.prototype.create_text = function () {
        var rect = document.createElementNS(svg_xmlns, 'rect');
        rect.setAttribute('class', 'node');
        this.group.appendChild(rect);
        var strings = [ 
            this.node.inputs.map(function (x) { return x.label }),
            [ this.node.label ],
            this.node.outputs.map(function (x) { return x.label })
        ].filter(function (ss) { return ss.length > 0 });

        var texts = strings.map(function (ss) { 
            return ss.map(function (s) {
                var text = document.createElementNS(svg_xmlns, 'text');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('alignment-baseline', 'middle');
                text.textContent = s;
                this.group.appendChild(text);
                return text;
            }, this);
        }, this);

        var line_height = max(texts.map(function (ts) {
            return ts.length ? max(ts.map(function (t) { return t.getBBox().height + 5; })) : 0; 
        }));

        var max_widths = texts.map(function (ts) {
            return ts.length ? max(ts.map(function (t) { return t.getBBox().width + 10; })) : 0;
        });
        this.width = max(max_widths.map(function(w, i) { return w * texts[i].length }));
        this.height = line_height * texts.length;

        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        
        texts.forEach(function (ts, i) {
            ts.forEach(function (t, j) {
                t.setAttribute('x', (this.width / ts.length / 2) * (2 * j + 1));
                t.setAttribute('y', (i+0.5) * line_height);
            }, this);
        }, this);
    }

    var svg = document.createElementNS(svg_xmlns, 'svg');
    svg.setAttribute('height', '100%');
    svg.setAttribute('width', '100%');
    document.body.appendChild(svg);

    var display_nodes = nodes.map(function (node) {
        var display_node = new DisplayNode(node);
        display_node.create_group(svg);
        display_node.create_text();
        return display_node;
    });

    display_nodes.forEach(function (dnode) {
        dnode.create_edges(svg);
    });

    display_nodes.forEach(function (dnode) {
        dnode.update_position();
    });

    svg.addEventListener('dblclick', function (e) {
        var node = { label: 'Foo', inputs: [], outputs: [], geometry: { x: e.screenX, y: e.screenY } };
        nodes.push(node);
        var display_node = new DisplayNode(node);
        display_node.create_group(svg);
        display_node.create_text();
        display_node.update_position();
    });
}
