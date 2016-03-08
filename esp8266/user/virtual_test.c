#include <stdio.h>
#include "virtual.h"

uint8_t prog1_buf[] = "00000001 00000064 00002710 0000beef";

uint8_t prog2_buf[] = {
    0x00, 0x00, 0x00, 0x01,  //  2: constant 0.01
    0x00, 0x00, 0x00, 0x64,  //  3: constant 1.00
    0x00, 0x00, 0x27, 0x10,  //  4: constant 100.00
    0x00, 0x00, 0xbe, 0xef,  //  5: constant -166.57
    0x01, 0x00, 0x00, 0x01,  //  6: $0 + $1
    0x02, 0x00, 0x00, 0x01,  //  7: $0 - $1
    0x03, 0x00, 0x10, 0x01,  //  8: $1 * $1
    0x04, 0x00, 0x40, 0x03,  //  9: $4 / $3
    0x01, 0x00, 0x60, 0x01,  //  A: $6 + $4
    0x02, 0x00, 0x70, 0x01,  //  B: $7 - $4
    0x03, 0x00, 0x80, 0x01,  //  C: $8 * $4
    0x04, 0x00, 0x90, 0x01,  //  D: $9 / $4
    0x01, 0x00, 0xC0, 0x0D,  //  E: $C + $D
    0x03, 0x00, 0xC0, 0x0E,  //  F: $C * $E
};

void prog_dump(virtual_prog_t *prog) {
    int i;
    for (i=0; i<16; i++) {
        printf("%d: %f\n", i, (double)virtual_get_output(prog, i) / 100);
    }
    printf("=====\n");
}

int main(int argc, char **argv) {

    virtual_prog_t *prog = virtual_init(2,16);

    virtual_load_hex(prog, prog1_buf, sizeof(prog1_buf));

    prog_dump(prog);
    
    virtual_load_bin(prog, prog2_buf, sizeof(prog2_buf));

    virtual_set_input(prog, 0, 10700);
    virtual_set_input(prog, 1, -523);

    prog_dump(prog);

    virtual_exec(prog);

    prog_dump(prog);

    virtual_set_input(prog, 0, 20000);
    virtual_set_input(prog, 1, 100);

    virtual_exec(prog);

    prog_dump(prog);

    virtual_free(prog);
}
