//#include <stdio.h>
#include <string.h>
#include <strings.h>

int ets_sprintf(char *str, const char *format, ...)  __attribute__ ((format (printf, 2, 3)));

#include "virtual.h"

#define MIN(a,b) ((a)<(b)?(a):(b))
#define MAX(a,b) ((a)>(b)?(a):(b))
#define FROM_HEX(c) ('0' <= (c) && c <= '9' ? (c) - '0' : ((c) & 31) + 9)

/*virtual_prog_t *virtual_init() {
    virtual_prog_t *prog = (virtual_prog_t *)calloc(1, sizeof(virtual_prog_t));
    return prog;
}*/

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


void virtual_exec(virtual_prog_t *prog) {

    // XXX This has to be kept aligned with "opcodes.json" which is 
    //     not great, but my cpp-fu is not sufficient to think of a 
    //     better way

    // XXX There's a potential buffer overrun here too when decoding
    //     instructions.

    // XXX handle underflow / overflow / division by zero gracefully

#define PORT_AT(n) (prog->ports[prog->codes[n]])

    int i = 0;
    while (i < 256) {
        switch (prog->codes[i]) {
            case OP_VAL16:
                PORT_AT(i+1) = ((int16_t)prog->codes[i+2] << 8) + prog->codes[i+3];
                i += 4;
                break;
            case OP_ADD:
                PORT_AT(i+3) = PORT_AT(i+1) + PORT_AT(i+2);
                i += 4;
                break;
            case OP_SUB:
                PORT_AT(i+3) = PORT_AT(i+1) - PORT_AT(i+2);
                i += 4;
                break;
            case OP_MUL:
                PORT_AT(i+3) = (int16_t)((int32_t)PORT_AT(i+1) * PORT_AT(i+2) / 100);
                i += 4;
                break;
            case OP_DIV:
                PORT_AT(i+3) = (int16_t)((int32_t)PORT_AT(i+1) * 100 / PORT_AT(i+2));
                i += 4;
                break;
            case OP_MAX:
                PORT_AT(i+3) = MAX(PORT_AT(i+1), PORT_AT(i+2));
                i += 4;
                break;
            case OP_MIN:
                PORT_AT(i+3) = MIN(PORT_AT(i+1), PORT_AT(i+2));
                i += 4;
                break;
            case OP_FLIPFLOP:
                if (PORT_AT(i+1) > PORT_AT(i+2)) {
                    PORT_AT(i+3) = 1; PORT_AT(i+4) = 0;
                } else if (PORT_AT(i+1) < PORT_AT(i+2)) {
                    PORT_AT(i+3) = 0; PORT_AT(i+4) = 1;
                } else if (PORT_AT(i+3) == 0) {
                    PORT_AT(i+4) = 1;
                } else if (PORT_AT(i+4) == 0) {
                    PORT_AT(i+3) = 1;
                }
                i += 5;
                break;
            case OP_RANGE:
                PORT_AT(i+1) = 0x1111;
                i += 2;
                break;
            case OP_LINES:
                PORT_AT(i+1) = 0x2222;
                PORT_AT(i+2) = 0x3333;
                i += 3;
                break;
            case OP_LIGHT:
                PORT_AT(i+1) = 0x4444;
                i += 2;
                break;
            case OP_MOTORL:
            case OP_MOTORR:
                i += 2;
                break;
            case OP_LEDS:
                i += 4;
                break;
            default:
                return;
        }
        prog->ports[0] = 0;
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
    int i, c=0;
    for (i=0; i<256; i++) {
        if (prog->ports[i]) c++;
    }
    return 8 * c;
}

void virtual_dump_hex(virtual_prog_t *prog, char *buf) {
    int i;
    for (i=0; i<256; i++) {
        if (prog->ports[i]) {
            ets_sprintf(buf, "%02x %04x\n", i, (uint16_t)prog->ports[i]);
            buf += 8;
        }
    }
}
        
/*void virtual_free(virtual_prog_t *prog) {
    free(prog);
}*/ 
