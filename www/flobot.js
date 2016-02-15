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

    function DisplayNode(node) {
        this.node = node;
    }

    DisplayNode.prototype.update_position = function () {
        this.group.setAttribute('transform', 'translate(' + this.node.geometry.x + ',' + this.node.geometry.y + ')');
    }

    DisplayNode.prototype.create_group = function (svg_element) {
        var self = this;
        this.group = document.createElementNS(svg_xmlns, 'g');
        svg_element.appendChild(this.group);
        this.group.addEventListener('mousedown', function (e) {
            self.group.parentNode.appendChild(self.group); // move to top
            self.drag_offset = [ self.node.geometry.x - e.screenX, self.node.geometry.y - e.screenY ]; 
        });
        this.group.addEventListener('mouseup', function (e) { self.drag_offset = null; })
        this.group.addEventListener('mouseleave', function (e) { self.drag_offset = null; })
        this.group.addEventListener('mousemove', function (e) {
            if (self.drag_offset) {
                self.node.geometry.x = self.drag_offset[0] + e.screenX;
                self.node.geometry.y = self.drag_offset[1] + e.screenY;
                self.update_position();
            } 
        })
    }

    DisplayNode.prototype.create_text = function () {
        var rect = document.createElementNS(svg_xmlns, 'rect');
        rect.setAttribute('stroke', '#000');
        rect.setAttribute('fill', '#EEC');
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

    var svg = document.createElementNS(svg_xmlns, 'svg');
    svg.setAttribute('height', '100%');
    svg.setAttribute('width', '100%');
    document.body.appendChild(svg);

    nodes.forEach(function (node) {
        var display_node = new DisplayNode(node);
        display_node.create_group(svg);
        display_node.create_text();
        display_node.update_position();
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
