#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <arpa/inet.h>
#include <assert.h>

#include "virtual.h"

#define MIN(a,b) ((a)<(b)?(a):(b))
#define MAX(a,b) ((a)>(b)?(a):(b))


void builtin_add(virtual_port_t ports[], size_t n_ports) {
    int32_t sum = 0;
    for (int i=0; i<n_ports-1; i++) sum += ports[i];
    ports[n_ports-1] = sum;
}

void builtin_sub(virtual_port_t ports[], size_t n_ports) {
    assert(n_ports == 3);
    ports[2] = ports[0] - ports[1];    
}

void builtin_mul(virtual_port_t ports[], size_t n_ports) {
    int32_t prod = 1;
    for (int i=0; i<n_ports-1; i++) prod *= ports[i] / 100;
    ports[n_ports-1] = prod;
}

void builtin_div(virtual_port_t ports[], size_t n_ports) {
    assert(n_ports == 3);
    ports[2] = (int32_t)ports[0] * 100 / ports[1];    
}

void builtin_cmp(virtual_port_t ports[], size_t n_ports) {
    assert(n_ports == 2);
    ports[1] = ports[0] < 0 ? -100 : ports[0] > 0 ? +100 : 0;
}

virtual_func_t builtins[] = {
    { 1, "{name:\"ADD\"}", builtin_add },
    { 2, "{name:\"SUB\"}", builtin_sub },
    { 3, "{name:\"MUL\"}", builtin_mul },
    { 4, "{name:\"DIV\"}", builtin_div },
    { 5, "{name:\"CMP\"}", builtin_add },
};

virtual_port_t _do_instruction(virtual_inst_t inst, virtual_port_t a, virtual_port_t b) {
    switch (inst) {
        case ADD: return a + b;
        case SUB: return a - b;
        case MUL: return (int16_t)((int32_t)a * (int32_t)b / 100);
        case DIV: return (int16_t)((int32_t)a * 100 / b); 
        case CMP: return a < b ? -100 : a > b ? +100 : 0;
        case DIF: return abs(a - b);
        default: return 0;
    }
}

#define MAX_PORTS (4096)
#define PORT_MAX (MAX_PORTS-1)

virtual_prog_t *virtual_init(size_t n_inputs, size_t n_outputs) {
    virtual_prog_t *prog = (virtual_prog_t *)calloc(1, sizeof(virtual_prog_t));

    prog->n_inputs = n_inputs;
    prog->n_outputs = n_outputs;
    return prog;
}

void _reallocate(virtual_prog_t *prog) {
    prog->n_ports = MAX(prog->n_codes, prog->n_outputs) + prog->n_inputs;

    prog->codes = realloc(prog->codes, prog->n_codes * sizeof(virtual_code_t));
    prog->ports = realloc(prog->ports, prog->n_ports * sizeof(virtual_port_t));
}
    
void _decode_instruction(uint32_t val, virtual_port_t *port_ptr, virtual_code_t *code_ptr) {
     uint8_t inst = val >> 24; 
     if (inst == NOP) { 
         *port_ptr = (int16_t)(val & 0xFFFF);
         code_ptr->inst = NOP;
         code_ptr->port_a = PORT_MAX;
         code_ptr->port_b = PORT_MAX;
     } else {
         *port_ptr = 0;
         code_ptr->inst = inst;
         code_ptr->port_a = (val >> 12) & 0xFFF;
         code_ptr->port_b = val & 0xFFF;
     }   
}

void virtual_load_bin(virtual_prog_t *prog, uint8_t *buf, size_t bufsiz) {
    uint16_t i;

    prog->n_codes = bufsiz / sizeof(uint32_t);
    _reallocate(prog);
    for (i=0; i<prog->n_codes; i++) {
        uint32_t val = ntohl(((uint32_t *)buf)[i]);
        _decode_instruction(val, &prog->ports[i+prog->n_inputs], &prog->codes[i]);
    } 
}

void virtual_load_hex(virtual_prog_t *prog, char *buf, size_t bufsiz) {
    int i;

    prog->n_codes = bufsiz / 9;
    _reallocate(prog);
    for (i=0; i<prog->n_codes; i++) {
        uint32_t val = strtoul(buf + i*9, NULL, 16);
        _decode_instruction(val, &prog->ports[i+prog->n_inputs], &prog->codes[i]);
    } 
}

void virtual_exec(virtual_prog_t *prog) {
    int i;
    for (i=0; i<prog->n_codes; i++) {
        virtual_code_t vcode = prog->codes[i];
        if (vcode.inst != NOP) {
            virtual_port_t a = vcode.port_a != PORT_MAX ? prog->ports[vcode.port_a]: 0;
            virtual_port_t b = vcode.port_b != PORT_MAX ? prog->ports[vcode.port_b]: 0;
            virtual_port_t c = _do_instruction(vcode.inst, a, b);
            prog->ports[i + prog->n_ports - prog->n_codes] = c;
        }
    }
}
   
size_t virtual_dump_bin_size(virtual_prog_t *prog) {
    return 2 * prog->n_ports;
}
 
void virtual_dump_bin(virtual_prog_t *prog, uint8_t *buf) {
    int i;
    for (i=0; i<prog->n_ports; i++) {
        buf[i*2] = prog->ports[i] >> 8;
        buf[i*2+1] = prog->ports[i] & 0xFF;
    }
}

size_t virtual_dump_hex_size(virtual_prog_t *prog) {
    return 5 * prog->n_ports;
}

void virtual_dump_hex(virtual_prog_t *prog, char *buf) {
    int i;
    for (i=0; i<prog->n_ports; i++) {
        snprintf(buf+5*i, 5, "%04x ", (uint16_t)prog->ports[i]);
    }
}
        
void virtual_set_input(virtual_prog_t *prog, size_t input_num, virtual_port_t val) {
    prog->ports[input_num] = val;
}

virtual_port_t virtual_get_output(virtual_prog_t *prog, size_t output_num) {
    return prog->ports[prog->n_ports - prog->n_outputs + output_num];
}

void virtual_free(virtual_prog_t *prog) {
    if (prog->ports) free(prog->ports);
    if (prog->codes) free(prog->codes);
    free(prog);
} 
