// VM headers

#ifndef VIRTUAL_H
#define VIRTUAL_H

#include <stdint.h>
#include <stddef.h>

// XXX This has to be kept aligned with "opcodes.json" which is 
//     not great, but my cpp-fu is not sufficient to think of a 
//     better way

typedef enum opcodes_e {
    OP_VAL16 = 255,
    OP_ADD = 253,
    OP_SUB = 252,
    OP_MUL = 251,
    OP_DIV = 250,
    OP_MAX = 249,
    OP_MIN = 248,
    OP_FLIPFLOP = 247,
    OP_LINE = 246,
    OP_LIGHT = 245,
    OP_MLEFT = 244,
    OP_MRIGHT = 243,
} opcodes_t;
    
typedef struct virtual_prog_s {
    uint8_t codes[256];
    uint32_t ports[256];
} virtual_prog_t;


virtual_prog_t *virtual_init();

void virtual_load_bin(virtual_prog_t *prog, uint8_t *buf, size_t bufsiz);

void virtual_load_hex(virtual_prog_t *prog, char *buf, size_t bufsiz);

void virtual_exec(virtual_prog_t *prog);

size_t virtual_dump_bin_size(virtual_prog_t *prog);

void virtual_dump_bin(virtual_prog_t *prog, uint8_t *buf);

size_t virtual_dump_hex_size(virtual_prog_t *prog);

void virtual_dump_hex(virtual_prog_t *prog, char *buf);

void virtual_free(virtual_prog_t *prog);

#endif
