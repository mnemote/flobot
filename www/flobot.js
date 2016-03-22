window.onload = function () {
    
    var svg_xmlns = "http://www.w3.org/2000/svg";
        
    function max(numbers) {
        return Math.max.apply(null, numbers);
    }

    function sum(numbers) {
        return numbers.reduce(function (a,b) { return a+b; }, 0);
    }

    function ajax_get(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 3) {
                callback(xhr.responseText);
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    }

    
    // EDGE
   
    var Edge = function(port_src, port_dst) {
        this.port1 = port_src;
        this.port2 = port_dst;
    }

    Edge.prototype.update = function() {
        // XXX TODO continue playing with this
        var x1 = this.port1.get_geometry().x;
        var y1 = this.port1.get_geometry().y;
        var x2 = this.port2.get_geometry().x;
        var y2 = this.port2.get_geometry().y;
        var dy = Math.abs(y1 - y2) * 0.5 + 20;
        var dx = (y2 > y1) ? Math.sign(x2 - x1) * dy : 0;
        var spline_path = ['M', x1, y1, 'C', x1 + dx, y1 - dy, x2 - dx, y2 + dy, x2, y2].join(" ");
        this.svg_spline.setAttribute('d', spline_path);
    }

    Edge.prototype.init = function(svg_element) {
        this.svg_spline = document.createElementNS(svg_xmlns, 'path');
        this.svg_spline.setAttribute('class', 'edge');
        svg_element.insertBefore(this.svg_spline, svg_element.firstChild);
    }   
    
    // PORT

    var Port = function(node, label, offset_x, offset_y) {
        this.node = node;
        this.label = label;
        this.offset_x = offset_x;
        this.offset_y = offset_y;
        this.edges = [];
    }

    Port.prototype.init = function(svg_group) {
        this.svg_circle = document.createElementNS(svg_xmlns, 'circle');
        this.svg_circle.setAttribute('class', 'port');
        this.svg_circle.setAttribute('cx', this.offset_x);
        this.svg_circle.setAttribute('cy', this.offset_y);
        this.svg_circle.setAttribute('r', 12);
        this.svg_circle._port = this;
        svg_group.appendChild(this.svg_circle);
        if (this.label) {
            this.svg_label = document.createElementNS(svg_xmlns, 'text');
            this.svg_label.textContent = this.label;
            this.svg_label.setAttribute('class', 'port');
            this.svg_label.setAttribute('x', this.offset_x);
            this.svg_label.setAttribute('y', this.offset_y);
            this.svg_label._port = this;
            svg_group.appendChild(this.svg_label);
        }
    }

    Port.prototype.update = function() {
        this.edges.forEach(function (e) { e.update() });
    }

    Port.prototype.get_geometry = function() {
        return {
            x: this.node.geometry.x + this.offset_x,
            y: this.node.geometry.y + this.offset_y
        }
    }

    Port.prototype.create_edge = function(other) {
        var edge = new Edge(this, other);
        this.edges.push(edge);
        other.edges.push(edge);
        edge.init(this.node.prog.svg_element);
        edge.update();
    }

    // NODE

    var Node = function(prog, json, num) {
        this.prog = prog;
        this.json = json;
        this.input_ports = (json.inputs || []).map(function (p, n) {
            return new Port(this, p, 150*(n+1)/(json.inputs.length+1), 0);
        }, this);
        this.output_ports = (json.outputs || []).map(function (p, n) {    
            return new Port(this, p, 150*(n+1)/(json.outputs.length+1), 50);
        }, this); 
        this.geometry = { x: (num % 4) * 200 + 50, y: (num >> 2) * 100 + 50 };
    };

    Node.prototype.update = function() {
        var translate = 'translate(' + this.geometry.x + ',' + this.geometry.y + ')';
        this.svg_group.setAttribute('transform', translate);
        this.input_ports.forEach(function (p) { p.update(); });
        this.output_ports.forEach(function (p) { p.update(); });
    }

    Node.prototype.init_drag = function (e) {
        this.svg_group.parentNode.appendChild(this.svg_group); // move to top
        this.svg_group.setAttribute('class', 'node drag');
            
        var drag_offset_x = this.geometry.x - e.screenX;
        var drag_offset_y = this.geometry.y - e.screenY;
        
        var drag_move = function (e) {
            this.geometry.x = drag_offset_x + e.screenX;
            this.geometry.y = drag_offset_y + e.screenY;
            this.update();
            e.preventDefault();
        }.bind(this);

        var drag_end = function (e) {
            this.svg_group.removeEventListener('mousemove', drag_move);
            this.svg_group.removeEventListener('mouseup', drag_end);
            this.svg_group.removeEventListener('mouseleave', drag_end);
            this.svg_group.setAttribute('class', 'node');
            e.preventDefault();
        }.bind(this);
        
        this.svg_group.addEventListener('mousemove', drag_move);
        this.svg_group.addEventListener('mouseup', drag_end);
        this.svg_group.addEventListener('mouseleave', drag_end);
    }

    Node.prototype.init_port = function (port) {
        port.init(this.svg_group);
    }

    Node.prototype.init = function(svg_element) {
        this.svg_group = document.createElementNS(svg_xmlns, 'g');
        this.svg_group.setAttribute('class', 'node');
        this.svg_group._node = this;
        svg_element.appendChild(this.svg_group);
        this.svg_rect = document.createElementNS(svg_xmlns, 'rect');
        this.svg_group.appendChild(this.svg_rect);

        this.svg_label = document.createElementNS(svg_xmlns, 'text');
        this.svg_label.textContent = this.json.label;
        this.svg_label.setAttribute('x', 75);
        this.svg_label.setAttribute('y', 25);
        this.svg_label._node = this;
        this.svg_group.appendChild(this.svg_label);
        
        this.svg_group.addEventListener('mousedown', this.init_drag.bind(this));
        
        this.update();

        this.input_ports.forEach(this.init_port, this);
        this.output_ports.forEach(this.init_port, this);
    }

    // PROG

    function Prog(json) {
        this.nodes = json.map(function (n, num) {
            return new Node(this, n, num);
        }, this);
    }

    Prog.prototype.node_init = function (node) {
        node.init(this.svg_element);
    }

    Prog.prototype.init = function(html_element) {
        this.svg_element = document.createElementNS(svg_xmlns, 'svg');
        this.svg_element.setAttribute('height', '100%');
        this.svg_element.setAttribute('width', '100%');
        html_element.appendChild(this.svg_element);

        this.nodes.forEach(this.node_init, this);
    
        function new_node() {
            var node = new Node(this, {label: "Foo",inputs: ['a','b'], outputs: ['c']}, this.nodes.length);
            this.nodes.push(node);
            node.init(this.svg_element);
        }

        this.svg_element.addEventListener('dblclick', new_node.bind(this));

        this.svg_element.addEventListener('mousedown', function (e) {
            if (e.target._port) {
            
            } 
            else if (e.target._node) {
                
            }
            else {


            }
            e.preventDefault();
        }.bind(this));

/*        this.svg_element.addEventListener('mousemove', function (e) {

        }.bind(this));

        this.svg_element.addEventListener('mouseup', function (e) {

        }.bind(this));
*/

    }

    ajax_get('builtins.json', function (data) {
        var json = JSON.parse(data);
        var prog = new Prog(json);
        prog.init(document.body);

        prog.nodes[2].input_ports[0].create_edge(
            prog.nodes[0].output_ports[0]
        );

        prog.nodes[3].input_ports[0].create_edge(
            prog.nodes[0].output_ports[1]
        );


    });
}
