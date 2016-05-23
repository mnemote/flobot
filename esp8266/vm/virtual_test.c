#include <stdio.h>
#include "virtual.h"

uint8_t prog_buf[] = {
    255, 0x01, 0x00, 0x01,    // $1 = constant 0.01
    255, 0x02, 0x00, 0x64,    // $2 = constant 1.00
    255, 0x03, 0x27, 0x10,    // $3 = constant 100.00
    224, 0x01, 0x02, 0x04,      // $4 = $1 + $2
    224, 0x04, 0x03, 0x05,      // $5 = $4 + $3
    226, 0x05, 0x05, 0x06,      // $6 = $5 * $5
};

char dump_buf[1500] = {0};

int main(int argc, char **argv) {

    virtual_prog_t prog = {{0}};

    virtual_load_bin(&prog, prog_buf, sizeof(prog_buf));

    virtual_dump_hex(&prog, dump_buf);
    printf("%s\n", dump_buf);
    
    virtual_exec(&prog);

    virtual_dump_hex(&prog, dump_buf);
    printf("%s\n", dump_buf);

    virtual_free(&prog);
}
