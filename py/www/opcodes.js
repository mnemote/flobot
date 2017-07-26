 [
 { "label": "Line Sensor", "outputs": [{"label": "L", "type": "bool", "name": "line_left"}, {"label": "R", "type": "bool", "name": "line_right"}] },
 { "label": "Ambient Light", "outputs": [{"name": "ambient"}] },
 { "label": "Left Wheel", "inputs": [{ "name": "motor_left" } ] },
 { "label": "Right Wheel", "inputs": [{ "name": "motor_right" }]},
 { "label": "Add", "inputs": [{}, {}], "outputs": [{}], "template": "$C = $A + $B" },
 { "label": "Subtract", "inputs": [{}, {}], "outputs": [{}], "template": "$C = $A - $B" },
 { "label": "Multiply", "inputs": [{}, {}], "outputs": [{}], "template": "$C = $A * $B" },
 { "label": "Maximum", "inputs": [{}, {}], "outputs": [{}], "template": "$C = max($A, $B)" },
 { "label": "Flip-flop", "inputs": [{"label":"S","type":"bool"}, {"label":"R","type":"bool"}], "outputs": [{"label":"Q","type":"bool"}, {"label":"Q","type":"bool","invert":true}], "template": "if $A and not $B; $C=True;$D=False\nif $B and not $A: $C=False;$D=True" },
 { "label": "Compare", "inputs": [{}, {}], "outputs": [{"label":"<","type":"bool"},{"label":"=","type":"bool"},{"label":">","type":"bool"}], "template": "$C=$A<$B; $D=$A==$B; $E=$A>$B" },
 { "label": "And", "inputs": [{"type":"bool"}, {"type":"bool"}], "outputs": [{"type":"bool"}], "template": "$C = $A and $B" },
 { "label": "Or", "inputs": [{"type":"bool"}, {"type":"bool"}], "outputs": [{"type":"bool"}], "template": "$C = $A or $B" },
 { "label": "Not", "inputs": [{"type":"bool"}], "outputs": [{"type":"bool"}], "template": "$B = not $A" },
 { "label": "If/Then/Else", "inputs": [{"type":"bool"}, {}, {}], "outputs": [{}], "template": "$D = $B if $A else $C" },
 { "label": "Variable", "outputs": [{}], "variable": true },
 { "label": "Variable", "outputs": [{ "type": "bool"}], "variable": true }
 ]   
