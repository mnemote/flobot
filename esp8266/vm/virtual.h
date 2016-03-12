// VM headers

#ifndef VIRTUAL_H
#define VIRTUAL_H

#include <stdint.h>
#include <stddef.h>

typedef int16_t virtual_port_t;

typedef struct virtual_func_s {
    uint8_t opcode;
    char *json_data;
    void(*func_call)(virtual_port_t[], size_t);
} virtual_func_t;

    
typedef enum virtual_inst_e {
    NOP,
    ADD,
    SUB,
    MUL,
    DIV,
    CMP,
    DIF
} virtual_inst_t;


typedef struct __attribute__((packed)) virtual_code_s { 
    virtual_inst_t inst:8;
    unsigned int port_a:12;
    unsigned int port_b:12;
} virtual_code_t;    

typedef struct virtual_prog_s {
    uint16_t n_inputs;
    uint16_t n_outputs;
    uint16_t n_ports;
    uint16_t n_codes;

    virtual_port_t *ports;
    virtual_code_t *codes;
} virtual_prog_t;


virtual_prog_t *virtual_init(size_t n_inputs, size_t n_outputs);

void virtual_load_bin(virtual_prog_t *prog, uint8_t *buf, size_t bufsiz);

void virtual_load_hex(virtual_prog_t *prog, char *buf, size_t bufsiz);

void virtual_exec(virtual_prog_t *prog);

void virtual_set_input(virtual_prog_t *prog, size_t input_num, virtual_port_t val);
virtual_port_t virtual_get_output(virtual_prog_t *prog, size_t output_num);

size_t virtual_dump_bin_size(virtual_prog_t *prog);

void virtual_dump_bin(virtual_prog_t *prog, uint8_t *buf);

size_t virtual_dump_hex_size(virtual_prog_t *prog);

void virtual_dump_hex(virtual_prog_t *prog, char *buf);

void virtual_free(virtual_prog_t *prog);

#endif
