window.onload = function () {
    
    var svg_xmlns = "http://www.w3.org/2000/svg";
        
    function max(numbers) {
        return Math.max.apply(null, numbers);
    }

    function sum(numbers) {
        return numbers.reduce(function (a,b) { return a+b; }, 0);
    }

    function to_hex_byte(num) {
        return ((1*num)+256).toString(16).substr(1);
    }

    var ports_available = [];
    for (var i=1; i<256; i++) ports_available.push(i);

    function ajax_get(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                callback(xhr.status, xhr.responseText);
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    }

    function ajax_post(url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                callback(xhr.status, xhr.responseText);
            }
        };
        xhr.open("POST", url, true);
        xhr.send(data);
    }
    
    function new_element(nameSpace, tagName, attributes, textContent) {
        var element = document.createElementNS(nameSpace, tagName);
        if (attributes) attributes.forEach(function (a) {
            element.setAttribute(a[0], a[1]);
        });
        if (textContent) element.textContent = textContent;
        return element;
    }

    // EDGE
   
    var Edge = function(port_src, port_dst) {
        this.port_src = port_src || port_dst;
        this.port_dst = port_dst || port_src;

        this.x1 = this.port_src.offset_x + this.port_src.node.geometry.x;
        this.y1 = this.port_src.offset_y + this.port_src.node.geometry.y;
        this.x2 = this.port_dst.offset_x + this.port_dst.node.geometry.x;
        this.y2 = this.port_dst.offset_y + this.port_dst.node.geometry.y;
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

    Edge.prototype.init = function(svg_parent) {
        this.svg_parent = svg_parent;
        this.svg_spline = document.createElementNS(svg_xmlns, 'path');
        this.svg_spline.setAttribute('class', 'edge');
        this.svg_parent.insertBefore(this.svg_spline, svg_parent.firstChild);
    }   
    
    Edge.prototype.deinit = function() {
        this.svg_spline.remove();
    }

    Edge.prototype.delete = function() {
        this.port_src.edges = this.port_src.edges.filter(function (e) { return e != this }, this);
        this.port_dst.edges = this.port_dst.edges.filter(function (e) { return e != this }, this);
        this.port_dst.port_id = null;
        if (this.port_src.edges.length == 0) {
            ports_available.unshift(this.port_src.port_id);
            this.port_src.port_id = null;
        }
        
    }

    // PORT

    var Port = function(node, json, is_input, offset_x, offset_y) {
        this.node = node;
        this.label = json.label;
        this.invert = json.invert;
        this.type = json.type || 'num';
        this.is_input = is_input;
        this.offset_x = offset_x;
        this.offset_y = offset_y;
        this.edges = [];
    }

    Port.prototype.drag_init = function () {
        if (this.node.toolbox) return null;
        if (this.is_input) this.remove_edges();
        var new_edge = new Edge(this, null);
        new_edge.init(this.node.prog.svg_element);
        this.svg_port.setAttribute('class', 'port drag');
        new_edge.svg_spline.setAttribute('class', 'edge drag');
        this.node.prog.nodes.forEach(function (n) {
            if (!n.toolbox && this.is_input) {
                n.output_ports.forEach(function (p) {
                    if (p.type == this.type) {
                        p.svg_port.setAttribute('class', 'port drag');
                    }
                }, this);
            }
            if (!n.toolbox && !this.is_input) {
                n.input_ports.forEach(function (p) {
                    if (p.type == this.type) {
                        p.svg_port.setAttribute('class', 'port drag');
                    }
                }, this);
            }
        }, this);    
        var new_target_port = null;
        return {
            drag: function(target, delta_x, delta_y) {
                if (this.is_input) new_edge.move_src(delta_x, delta_y);
                else new_edge.move_dst(delta_x, delta_y);
                if (target && target.edges && target.type == this.type && target.node != this.node && target.is_input != this.is_input && !target.node.toolbox) {
                    new_target_port = target;
                    target.svg_port.setAttribute("class", "port drag okay");
                    this.svg_port.setAttribute("class", "port drag okay");
                    new_edge.svg_spline.setAttribute("class", "edge drag okay");
                } else {
                    this.svg_port.setAttribute("class", "port drag");
                    new_edge.svg_spline.setAttribute("class", "edge drag");
                    if (new_target_port) { 
                        new_target_port.svg_port.setAttribute("class", "port drag");
                        new_target_port = null;
                    }
                }
            }.bind(this),
            done: function(target) {
                this.node.prog.nodes.forEach(function (n) {
                    n.input_ports.forEach(function (p) {
                        p.svg_port.setAttribute('class', 'port');
                    }, this);
                    n.output_ports.forEach(function (p) {
                        p.svg_port.setAttribute('class', 'port');
                    }, this);
                }, this);
                new_edge.svg_spline.setAttribute('class', 'edge drag');
                if (target && target.edges && target.type == this.type && target.node != this.node && !target.node.toolbox) {
                    if (this.is_input && !target.is_input) {
                        this.remove_edges();
                        target.create_edge(this);
                    } else if (target.is_input && !this.is_input) {
                        target.remove_edges();
                        this.create_edge(target);
                    }
                }
                new_edge.deinit();    
            }.bind(this)    
        }
    }

    Port.prototype.init = function(svg_group) {
        this.svg_group = svg_group;
        if (this.type == 'bool') {
            this.svg_port = document.createElementNS(svg_xmlns, 'rect');
            this.svg_port.setAttribute('class', 'port');
            this.svg_port.setAttribute('x', this.offset_x - 12);
            this.svg_port.setAttribute('y', this.offset_y - 12);
            this.svg_port.setAttribute('width', 24);
            this.svg_port.setAttribute('height', 24);
            this.svg_port.setAttribute('rx', 5);
        } else {
            this.svg_port = document.createElementNS(svg_xmlns, 'circle');
            this.svg_port.setAttribute('class', 'port');
            this.svg_port.setAttribute('cx', this.offset_x);
            this.svg_port.setAttribute('cy', this.offset_y);
            this.svg_port.setAttribute('r', 12);
        }
        this.svg_port._target = this;
        svg_group.appendChild(this.svg_port);
        if (this.label) {
            this.svg_label = document.createElementNS(svg_xmlns, 'text');
            this.svg_label.textContent = this.label;
            this.svg_label.setAttribute('class', this.invert ? 'port invert' : 'port');
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
        this.edges.forEach(function (e) { e.deinit(); e.delete(); });
    }

    Port.prototype.create_edge = function(other) {
        // 'this' is an output port.  'other' is an input port
        var edge = new Edge(this, other);
        this.edges.push(edge);
        other.edges.push(edge);
        
        if (!this.port_id) this.port_id = ports_available.shift();
        other.port_id = this.port_id;
        
        other.node.reorder(this.node);
        edge.init(this.node.prog.svg_element);
        edge.update();
    }

    Port.prototype.show_value = function(value) {
        if (!this.svg_value) {
            this.svg_value = document.createElementNS(svg_xmlns, 'text');
            this.svg_value.setAttribute('class', 'edge');
            this.svg_value.setAttribute('x', this.offset_x);
            this.svg_value.setAttribute('y', this.offset_y + 30);
            this.svg_group.appendChild(this.svg_value);
        }
        this.svg_value.textContent = value;
    }

    Port.prototype.hide_value = function() {
        if (this.svg_value) this.svg_value.remove();
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
        this.order = 0;
        this.geometry = json.geometry || { x: 100, y: 100 };
        this.variable = json.variable;
    };

    Node.prototype.is_active = function() {
        if (this.input_ports.length) {
            return this.input_ports.some(function (p) { return p.edges.length > 0 });
        } else {
            return this.output_ports.some(function (p) { return p.edges.length > 0 });
        }
    }
    
    Node.prototype.reorder = function(other) {
        if (other.order < 1) other.order = 1;
        if (this.order <= other.order) {
            this.order = other.order + 1;
            this.output_ports.forEach(function (p) {
                if (!p.port_id) p.port_id = ports_available.shift();
                p.edges.forEach(function (e) {
                    if (e.port_dst.node.order <= other.order) {
                        e.deinit();
                        e.delete();
                    } else {
                        e.port_dst.node.reorder(this);
                    }
                }, this);   
            }, this);
        }
    }

    Node.prototype.get_value = function(target) {
        if (this.output_ports[0].type == 'bool') {
            this.variable_value = target.checked ? 0.01 : 0;
        } else {
            this.variable_value = Math.round(100 * target.value) / 100;
        }
    }

    Node.prototype.update = function() {
        var translate = 'translate(' + this.geometry.x + ',' + this.geometry.y + ')';
        this.svg_group.setAttribute('transform', translate);
        this.input_ports.forEach(function (p) { p.update(); });
        this.output_ports.forEach(function (p) { p.update(); });
        if (this.html_input) {
            var x = this.geometry.x + 18;
            var y = this.geometry.y + 15;
            var h = (this.geometry.height || 50) - 20;
            var w = (this.output_ports[0].type == "bool") ? h : (this.geometry.width || 150) - 20;

            this.html_input.setAttribute('style', 'position:fixed;width:' + w + ';height:' + h +
                                                ';top:' + y + ';left:' + x);
        }
    }

    Node.prototype.drag_init = function() {
        if (this.toolbox) {
            var other = new Node(this.prog, this.json);
            other.geometry.x = this.geometry.x;
            other.geometry.y = this.geometry.y;
            other.init(this.svg_group.parentNode);
            this.prog.nodes.push(other);
            return other.drag_init();
        }

        this.svg_group.parentNode.appendChild(this.svg_group); // move to top
        this.svg_group.setAttribute('class', 'node drag');
    
        return {
            drag: function(target, delta_x, delta_y) {
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
        
        var w = this.geometry.width || 150;
        var h = this.geometry.height || (w/3);
        var r = this.geometry.corner || (h/10);

        if (this.variable) {
            var s = document.createElementNS(svg_xmlns, 'rect');
            s.setAttribute('width', w);
            s.setAttribute('height', h);
            s.setAttribute('rx', h/2);
            s._target = this;
            this.svg_group.appendChild(s);

            if (!this.toolbox) {
                this.html_input = document.createElement('input');
                if (this.output_ports[0].type == 'bool') {
                    this.html_input.setAttribute('type', 'checkbox');
                    this.html_input.addEventListener('change', function (e) {
                        this.variable_value = this.html_input.checked ? 0.01 : 0;
                        this.prog.upload();
                    }.bind(this));
                } else {
                    this.html_input.addEventListener('keyup', function (e) {
                        this.get_value(e.target);
                        this.prog.upload();
                    }.bind(this));
                    this.html_input.addEventListener('change', function (e) {
                        this.get_value(e.target);
                        this.prog.upload();
                        e.target.blur();
                        e.target.value = this.variable_value;
                    }.bind(this));
                }
                this.prog.svg_element.parentNode.appendChild(this.html_input);

            }
        } else if (this.input_ports.length && this.output_ports.length) {
            var svg_rect = document.createElementNS(svg_xmlns, 'rect');
            svg_rect.setAttribute('width', w);
            svg_rect.setAttribute('height', h);
            svg_rect.setAttribute('rx', r);
            svg_rect._target = this;
            this.svg_group.appendChild(svg_rect);
        } else {
            var svg_path = document.createElementNS(svg_xmlns, 'path');
            var path_d = (this.output_ports.length) ?
                ['M',0,h/2,'A',w/2,h/2,0,0,1,w,h/2,'L',w,h-r,'A',r,r,0,0,1,w-r,h,'L',r,h,'A',r,r,0,0,1,0,h-r,'Z'] :
                ['M',0,h/2,'A',w/2,h/2,1,0,0,w,h/2,'L',w,r,'A',r,r,0,0,0,w-r,0,'L',r,0,'A',r,r,0,0,0,0,r,'Z'];
            svg_path.setAttribute('d', path_d.join(' '));
            svg_path._target = this;
            this.svg_group.appendChild(svg_path);
        }

        if (!this.html_input) {
            this.svg_label = document.createElementNS(svg_xmlns, 'text');
            this.svg_label.textContent = this.json.label;
            this.svg_label.setAttribute('x', w/2);
            this.svg_label.setAttribute('y', h/2);
            this.svg_label._target = this;
            this.svg_group.appendChild(this.svg_label);
        }
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

    Prog.prototype.node_init = function (node, n) {
        node.geometry.x = (n % 4) * 200 + 50;
        node.geometry.y = Math.floor(n / 4) * 150 + 50;
        node.init(this.svg_element);
    }

    Prog.prototype.upload = function() {
        var s = this.serialize(false);
       ajax_post('/load/hex', s.replace(/\s+/g, ''), this.update.bind(this));
    }

    var poll_timer = null;

    Prog.prototype.poll = function() {
        ajax_get('/dump', this.update.bind(this));
    }

    Prog.prototype.update = function (status,text) {
        if (status == 200) {
            var ports_dict = {};
            var pp = text.split(/\s+/);
            for (var i=0; i<pp.length; i+=2) {
                var val = parseInt(pp[i+1], 16);
                if (val > 0x7FFF) val -= 0x10000;
                ports_dict[1*pp[i]] = val / 100;
            }
            this.nodes.forEach(function (n) {
                n.output_ports.forEach(function (p) {
                    if (p.port_id && ports_dict[p.port_id])
                        p.show_value(ports_dict[p.port_id]);
                    else p.hide_value();
                }, this);
            }, this);

            if (poll_timer) clearTimeout(poll_timer);
            poll_timer = setTimeout(function () { prog.poll() }, 1000);
        }

        var s = this.serialize(true) + "\n\n" + (status == 200 ? text : status);
        document.getElementById('debug').textContent = s;
    }
    
    Prog.prototype.init = function(html_element) {
        this.svg_element = document.createElementNS(svg_xmlns, 'svg');
        this.svg_element.setAttribute('height', '100%');
        this.svg_element.setAttribute('width', '100%');
        html_element.appendChild(this.svg_element);

        this.nodes.filter(function (node) {
            return node.input_ports.length == 0 && node.output_ports.length > 0 && !node.variable;
        }).forEach(function (node, n) {
            node.geometry.x = 25 + n * 175;
            node.geometry.y = 25;
            node.init(this.svg_element);
        }, this);

        this.nodes.filter(function (node) {
            return node.input_ports.length > 0 && node.output_ports.length == 0;
        }).forEach(function (node, n) {
            node.geometry.x = 25 + n * 175;
            node.geometry.y = this.svg_element.clientHeight - 85;
            node.init(this.svg_element);
        }, this);

        var n_ops = 0;
        this.nodes.filter(function (node) {
            return (node.input_ports.length > 0 && node.output_ports.length > 0) || node.variable;
        }).forEach(function (node, n) {
            node.geometry.x = this.svg_element.clientWidth - 328 + (160 * (n % 2));
            node.geometry.y = Math.floor(n/2) * 85 + 25;
            node.toolbox = true;
            node.init(this.svg_element);
            n_ops = n;
        }, this);
        var toolbox = document.createElementNS(svg_xmlns, 'rect');
        toolbox.setAttribute('class', 'toolbox');
        toolbox.setAttribute('x', this.svg_element.clientWidth - 342);
        toolbox.setAttribute('y', 5);
        toolbox.setAttribute('width', 340);
        toolbox.setAttribute('height', Math.ceil((n_ops-1)/2) * 85 + 100);
        toolbox.setAttribute('rx', 10);
        this.svg_element.insertBefore(toolbox, this.svg_element.firstChild);
        
        var drag_target = null;
        var drag_offset_x = 0;
        var drag_offset_y = 0;

        function drag_start(e) {
            e.preventDefault();
            if (e.changedTouches) e = e.changedTouches[0];
            if (e.target._target) {
                drag_target = e.target._target.drag_init();
                drag_offset_x = e.screenX;
                drag_offset_y = e.screenY;
            }
        }

        function drag_move(e) {
            e.preventDefault();
            if (e.changedTouches) e = e.changedTouches[0];
            if (drag_target) {
                drag_target.drag(
                    e.target._target,
                    e.screenX - drag_offset_x,
                    e.screenY - drag_offset_y
                )
                drag_offset_x = e.screenX;
                drag_offset_y = e.screenY;
            }
            e.preventDefault();
        }

        function drag_end(e) {
            e.preventDefault();
            if (drag_target) {
                var target = e.target;
                if (e.changedTouches) {
                    target = document.elementFromPoint(
                        e.changedTouches[0].clientX,
                        e.changedTouches[0].clientY
                    );
                }
                drag_target.done(target._target);
                drag_target = null;

                this.upload();
            }
        }

        this.svg_element.addEventListener('mousedown', drag_start.bind(this));
        this.svg_element.addEventListener('touchstart', drag_start.bind(this));

        this.svg_element.addEventListener('mousemove', drag_move.bind(this));
        this.svg_element.addEventListener('touchmove', drag_move.bind(this));
        
        this.svg_element.addEventListener('mouseup', drag_end.bind(this));
        this.svg_element.addEventListener('mouseleave', drag_end.bind(this));
        this.svg_element.addEventListener('touchend', drag_end.bind(this));
        this.svg_element.addEventListener('touchcancel', drag_end.bind(this));
    }

    Prog.prototype.serialize = function(whitespace) {
        var nodes = this.nodes.filter(function (n) { return n.is_active() });
        nodes.sort(function (a, b) { return a.order - b.order; });
        
        return nodes.map(function (n) {
            if (n.variable) {
                var v = n.variable_value * 100;
                return to_hex_byte(n.json.op) + to_hex_byte(v >> 8) +
                       to_hex_byte(v & 0xFF) + to_hex_byte(n.output_ports[0].port_id || 0);
            } else {
                return to_hex_byte(n.json.op) +
                    n.input_ports.map(function (p) {
                        return (whitespace ? " " : "") + to_hex_byte(p.port_id || 0);
                    }).join("") +
                    n.output_ports.map(function (p) {
                        return (whitespace ? " " : "") + to_hex_byte(p.port_id || 0);
                    }).join("");
            }
        }).join(whitespace ? "\n" : "");

    }
    
    ajax_get('opcodes.json', function (status, data) {
        var json = JSON.parse(data);
        var prog = new Prog(json);
        prog.init(document.body);
    });

}
    
