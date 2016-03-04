#include "virtual.h"

vport_t _do_instruction(vinst_t inst, vport_t a, vport_t b, vport_t *c) {
    switch (inst) {
        case ADD: return a + b;
        case SUB: return a - b;
        case MUL: return a * b;
        case DIV: return a / b; 
        case CMP: return a < b ? -1 : a > b ? +1 : 0;
        default: return 0;
    }
}

void execute(vport_t *vports, int n_vports, vcode_t *vcodes, int n_vcodes) {
    for (var i=0; i<n_vcodes; i++) {
        vport_t a = vports[vcodes[i].vport_a];
        vport_t b = vports[vcodes[i].vport_b];
        vport_t c = _do_instruction(vcodes[i].inst, a, b);
        vports[i + n_vports - n_vcodes] = c;
    }
}
                

 
