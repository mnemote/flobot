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
        if (port_src && !port_dst) port_dst = port_src;
        if (port_dst && !port_src) port_src = port_dst;

        this.x1 = port_src.offset_x + port_src.node.geometry.x;
        this.y1 = port_src.offset_y + port_src.node.geometry.y;
        this.x2 = port_dst.offset_x + port_dst.node.geometry.x;
        this.y2 = port_dst.offset_y + port_dst.node.geometry.y;
    }

    Edge.prototype.update = function() {
        // XXX TODO continue playing with this
        var dy = Math.abs(this.y1 - this.y2) * 0.5 + 20;
        var dx = (this.y2 < this.y1) ? Math.sign(this.x2 - this.x1) * dy : 0;
        var spline_path = [
            'M', this.x1, this.y1,
            'C', this.x1 + dx, this.y1 + dy,
            this.x2 - dx, this.y2 - dy,
            this.x2, this.y2
        ].join(" ");
        this.svg_spline.setAttribute('d', spline_path);
    }

    Edge.prototype.move_src = function(delta_x, delta_y) {
        this.x1 += delta_x;
        this.y1 += delta_y;
        this.update();
    }

    Edge.prototype.move_dst = function(delta_x, delta_y) {
        this.x2 += delta_x;
        this.y2 += delta_y;
        this.update();
    }

    Edge.prototype.init = function(svg_element) {
        this.svg_spline = document.createElementNS(svg_xmlns, 'path');
        this.svg_spline.setAttribute('class', 'edge');
        svg_element.insertBefore(this.svg_spline, svg_element.firstChild);
    }   
    
    Edge.prototype.deinit = function() {
        this.svg_spline.remove();
    }

    // PORT

    var Port = function(node, label, is_input, offset_x, offset_y) {
        this.node = node;
        this.label = label;
        this.is_input = is_input;
        this.offset_x = offset_x;
        this.offset_y = offset_y;
        this.edges = [];
    }

    Port.prototype.drag_init = function () {
        if (this.is_input) this.remove_edges();
        var new_edge = new Edge(this, null);
        new_edge.init(this.node.prog.svg_element);
        this.svg_circle.setAttribute('class', 'port drag');
        new_edge.svg_spline.setAttribute('class', 'edge drag');
        
        return {
            drag: function(delta_x, delta_y) {
                if (this.is_input) new_edge.move_src(delta_x, delta_y);
                else new_edge.move_dst(delta_x, delta_y);
            }.bind(this),
            done: function(target) {
                this.svg_circle.setAttribute('class', 'port');
                if (target && target.edges) {
                    if (target.is_input) target.remove_edges();
                    this.edges.push(new_edge);
                    target.edges.push(new_edge);
                    new_edge.svg_spline.setAttribute('class', 'edge');
                } else {
                    new_edge.deinit();
                }    
            }.bind(this)    
        }
    }

    Port.prototype.init = function(svg_group) {
        this.svg_circle = document.createElementNS(svg_xmlns, 'circle');
        this.svg_circle.setAttribute('class', 'port');
        this.svg_circle.setAttribute('cx', this.offset_x);
        this.svg_circle.setAttribute('cy', this.offset_y);
        this.svg_circle.setAttribute('r', 12);
        this.svg_circle._target = this;
        svg_group.appendChild(this.svg_circle);
        if (this.label) {
            this.svg_label = document.createElementNS(svg_xmlns, 'text');
            if (this.label.substr(0,1) == "!") {
                this.svg_label.textContent = this.label.substr(1);
                this.svg_label.setAttribute('style', 'text-decoration: overline');
            } else {
                this.svg_label.textContent = this.label;
            }
            this.svg_label.setAttribute('class', 'port');
            this.svg_label.setAttribute('x', this.offset_x);
            this.svg_label.setAttribute('y', this.offset_y);
            this.svg_label._target = this;
            svg_group.appendChild(this.svg_label);
        }
    }

    Port.prototype.update = function() {
        this.edges.forEach(function (e) { e.update() });
    }

    Port.prototype.remove_edges = function() {
        this.edges.forEach(function (e) { e.deinit(); });
        this.edges = [];
    }

    Port.prototype.create_edge = function(other) {
        var edge = new Edge(this, other);
        this.edges.push(edge);
        other.edges.push(edge);
        edge.init(this.node.prog.svg_element);
        edge.update();
    }

    // NODE

    var Node = function(prog, json) {
        this.prog = prog;
        this.json = json;
        this.input_ports = (json.inputs || []).map(function (p, n) {
            return new Port(this, p, true, 150*(n+1)/(json.inputs.length+1), 0);
        }, this);
        this.output_ports = (json.outputs || []).map(function (p, n) {    
            return new Port(this, p, false, 150*(n+1)/(json.outputs.length+1), 50);
        }, this); 
        this.geometry = json.geometry || { x: 100, y: 100 };
    };

    Node.prototype.update = function() {
        var translate = 'translate(' + this.geometry.x + ',' + this.geometry.y + ')';
        this.svg_group.setAttribute('transform', translate);
        this.input_ports.forEach(function (p) { p.update(); });
        this.output_ports.forEach(function (p) { p.update(); });
    }

    Node.prototype.drag_init = function() {
        this.svg_group.parentNode.appendChild(this.svg_group); // move to top
        this.svg_group.setAttribute('class', 'node drag');
    
        return {
            drag: function(delta_x, delta_y) {
                this.geometry.x += delta_x;
                this.geometry.y += delta_y;
                this.update();
                this.input_ports.forEach(function (p) {
                    p.edges.forEach(function (e) {
                        e.move_dst(delta_x, delta_y);
                    });
                });
                this.output_ports.forEach(function (p) {
                    p.edges.forEach(function (e) {
                        e.move_src(delta_x, delta_y);
                    });
                });
            }.bind(this),
            done: function () {
                this.svg_group.setAttribute('class', 'node');
            }.bind(this)
        } 
    }
    
    Node.prototype.init_port = function (port) {
        port.init(this.svg_group);
    }

    Node.prototype.init = function(svg_element) {
        this.svg_group = document.createElementNS(svg_xmlns, 'g');
        this.svg_group.setAttribute('class', 'node');
        svg_element.appendChild(this.svg_group);
        
        this.svg_rect = document.createElementNS(svg_xmlns, 'rect');
        this.svg_rect.setAttribute('width', 150);
        this.svg_rect.setAttribute('height', 50);
        this.svg_rect.setAttribute('rx', 5);
        this.svg_rect._target = this;
        this.svg_group.appendChild(this.svg_rect);

        this.svg_label = document.createElementNS(svg_xmlns, 'text');
        this.svg_label.textContent = this.json.label;
        this.svg_label.setAttribute('x', 75);
        this.svg_label.setAttribute('y', 25);
        this.svg_label._target = this;
        this.svg_group.appendChild(this.svg_label);
        
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
            var node = new Node(this, {label: "Difference", inputs: ['+','-'], outputs: ['=']}, this.nodes.length);
            this.nodes.push(node);
            node.init(this.svg_element);
        }

        this.svg_element.addEventListener('dblclick', new_node.bind(this));

        var drag_target = null;
        var drag_offset_x = 0;
        var drag_offset_y = 0;

        function drag_start(e) {
            if (e.target._target) {
                drag_target = e.target._target.drag_init();
                drag_offset_x = e.screenX;
                drag_offset_y = e.screenY;
            }
            e.preventDefault();
        }

        function drag_move(e) {
            if (drag_target) {
                drag_target.drag(
                    e.screenX - drag_offset_x,
                    e.screenY - drag_offset_y
                )
                drag_offset_x = e.screenX;
                drag_offset_y = e.screenY;
            }
            e.preventDefault();
        }

        function drag_end(e) {
            if (drag_target) {
                drag_target.done(e.target._target);
                drag_target = null;
            }
            e.preventDefault();
        }

        this.svg_element.addEventListener('mousedown', drag_start.bind(this));
        this.svg_element.addEventListener('mousemove', drag_move.bind(this));
        this.svg_element.addEventListener('mouseup', drag_end.bind(this));
        this.svg_element.addEventListener('mouseleave', drag_end.bind(this));
    }

    ajax_get('builtins.json', function (data) {
        var json = JSON.parse(data);
        var prog = new Prog(json);
        prog.init(document.body);

    });
}
