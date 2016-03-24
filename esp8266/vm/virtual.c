#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <arpa/inet.h>
#include <assert.h>

#include "virtual.h"

#define MIN(a,b) ((a)<(b)?(a):(b))
#define MAX(a,b) ((a)>(b)?(a):(b))
#define FROM_HEX(c) ('0' <= (c) && c <= '9' ? (c) - '0' : ((c) & 31) + 9)

virtual_prog_t *virtual_init() {
    virtual_prog_t *prog = (virtual_prog_t *)calloc(1, sizeof(virtual_prog_t));
    return prog;
}

void virtual_load_bin(virtual_prog_t *prog, uint8_t *buf, size_t bufsiz) {
    bzero(prog->codes, sizeof(prog->codes));
    bzero(prog->ports, sizeof(prog->ports));
    memcpy(prog->codes, buf, bufsiz);
}

void virtual_load_hex(virtual_prog_t *prog, char *buf, size_t bufsiz) {
    int i;
    bzero(prog->codes, sizeof(prog->codes));
    bzero(prog->ports, sizeof(prog->ports));
    for (i=0; i<bufsiz/2; i++) {
        prog->codes[i] = (FROM_HEX(buf[i*2]) << 4) + FROM_HEX(buf[i*2+1]);
    }
}

#define PORT_AT(n) (prog->ports[prog->codes[i+n]])

void virtual_exec(virtual_prog_t *prog) {

    // XXX This has to be kept aligned with "opcodes.json" which is 
    //     not great, but my cpp-fu is not sufficient to think of a 
    //     better way

    // XXX There's a potential buffer overrun here too when decoding
    //     instructions.

    // XXX handle underflow / overflow / division by zero gracefully

    int i = 0;
    while (i < sizeof(prog->codes)) {
        switch (prog->codes[i]) {
            case OP_VAL16:
                PORT_AT(1) = ((int16_t)prog->codes[i+2] << 8) + prog->codes[i+3];
                i += 4;
                break;
            case OP_ADD:
                PORT_AT(3) = PORT_AT(1) + PORT_AT(2);
                i += 4;
                break;
            case OP_SUB:
                PORT_AT(3) = PORT_AT(1) - PORT_AT(2);
                i += 4;
                break;
            case OP_MUL:
                PORT_AT(3) = (int16_t)((int32_t)PORT_AT(1) * PORT_AT(2) / 100);
                i += 4;
                break;
            case OP_DIV:
                PORT_AT(3) = (int16_t)((int32_t)PORT_AT(1) * 100 / PORT_AT(2));
                i += 4;
                break;
            case OP_MAX:
                PORT_AT(3) = MAX(PORT_AT(1), PORT_AT(2));
                i += 4;
                break;
            case OP_MIN:
                PORT_AT(3) = MIN(PORT_AT(1), PORT_AT(2));
                i += 4;
                break;
            case OP_FLIPFLOP:
                if (PORT_AT(1) > PORT_AT(2)) {
                    PORT_AT(3) = 1; PORT_AT(4) = 0;
                } else if (PORT_AT(1) < PORT_AT(2)) {
                    PORT_AT(3) = 0; PORT_AT(4) = 1;
                } else if (PORT_AT(3) == 0) {
                    PORT_AT(4) = 1;
                } else if (PORT_AT(4) == 0) {
                    PORT_AT(3) = 1;
                }
                i += 5;
                break;
            case OP_LINE:
                PORT_AT(1) = 0;
                PORT_AT(2) = 0;
                i += 3;
                break;
            case OP_LIGHT:
                PORT_AT(1) = 0;
                i += 2;
                break;
            case OP_MLEFT:
            case OP_MRIGHT:
                i += 2;
                break;
            default:
                return;
        }
    }
}
   
size_t virtual_dump_bin_size(virtual_prog_t *prog) {
    return 2 * 256;
}
 
void virtual_dump_bin(virtual_prog_t *prog, uint8_t *buf) {
    int i;
    for (i=0; i<256; i++) {
        buf[i*2] = prog->ports[i] >> 8;
        buf[i*2+1] = prog->ports[i] & 0xFF;
    }
}

size_t virtual_dump_hex_size(virtual_prog_t *prog) {
    return 5 * 256;
}

void virtual_dump_hex(virtual_prog_t *prog, char *buf) {
    int i;
    for (i=0; i<256; i++) {
        snprintf(buf+5*i, 6, "%04x ", (uint16_t)prog->ports[i]);
    }
}
        
void virtual_free(virtual_prog_t *prog) {
    free(prog);
} 
