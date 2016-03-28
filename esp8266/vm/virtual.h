// VM headers

#ifndef VIRTUAL_H
#define VIRTUAL_H

#include <stdint.h>
#include <stddef.h>

// XXX This has to be kept aligned with "opcodes.json" which is 
//     not great, but my cpp-fu is not sufficient to think of a 
//     better way

typedef enum opcodes_e {
    OP_RANGE = 160,
    OP_LINES = 161,
    OP_LIGHT = 162,
    OP_MOTORL = 176,
    OP_MOTORR = 177,
    OP_LEDS = 178,
    OP_ADD = 224,
    OP_SUB = 225,
    OP_MUL = 226,
    OP_DIV = 227,
    OP_MAX = 228,
    OP_MIN = 229,
    OP_FLIPFLOP = 230,
    OP_VAL16 = 255,
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
