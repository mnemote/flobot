// VM headers

#ifndef VIRTUAL_H
#define VIRTUAL_H

#include <stdint.h>
#include <stddef.h>

typedef struct virtual_prog_s {
    uint8_t codes[256];
    int16_t ports[256];
} virtual_prog_t;


void virtual_init(virtual_prog_t *prog);

void virtual_load_bin(virtual_prog_t *prog, uint8_t *buf, size_t bufsiz);

void virtual_load_hex(virtual_prog_t *prog, char *buf, size_t bufsiz);

void virtual_exec(virtual_prog_t *prog);

size_t virtual_dump_bin_size(virtual_prog_t *prog);

void virtual_dump_bin(virtual_prog_t *prog, uint8_t *buf);

size_t virtual_dump_hex_size(virtual_prog_t *prog);

void virtual_dump_hex(virtual_prog_t *prog, char *buf);

void virtual_free(virtual_prog_t *prog);

#endif
