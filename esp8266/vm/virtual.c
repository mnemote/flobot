//#include <stdio.h>
#include <c_types.h>
#include <string.h>
#include <strings.h>
#include <gpio.h>
#include <user_interface.h>

// XXX Is this really not defined *somewhere*?
int ets_sprintf(char *str, const char *format, ...)  __attribute__ ((format (printf, 2, 3)));

#include "virtual.h"

#define MIN(a,b) ((a)<(b)?(a):(b))
#define MAX(a,b) ((a)>(b)?(a):(b))
#define FROM_HEX(c) ('0' <= (c) && c <= '9' ? (c) - '0' : ((c) & 31) + 9)


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

// The lines which start ///// get extracted by the Makefile and used to build a JSON
// document "opcodes.json" which is served up at runtime.  This probably isn't the most
// elegant way of doing this -- I was trying to work out a way using cpp -- but at least
// it preserves some locality between VM instruction definitions and implementations.

void virtual_exec(virtual_prog_t *prog) {

    // XXX There's a potential buffer overrun here too when decoding
    //     instructions.

    // XXX handle underflow / overflow / division by zero gracefully

#define PORT_AT(n) (prog->ports[prog->codes[n]])

///// [
    int i = 0;
    while (i < 256) {
        switch (prog->codes[i]) {

///// { "op": 160, "label": "Range Sensor", "outputs": [{}] },
	    case 160:
                PORT_AT(i+1) = system_adc_read() & 0xFFFF;
                i += 2;
		break;

///// { "op": 161, "label": "Line Sensor", "outputs": [{"label": "L", "type": "bool"}, {"label": "R", "type": "bool"}] },
	    case 161:
		PORT_AT(i+1) = 0;
                PORT_AT(i+2) = 1;
                i += 3;
		break;

///// { "op": 162, "label": "Ambient Light", "outputs": [{}] },
	    case 162:
		PORT_AT(i+1) = 0;
                i += 2;
                break;

///// { "op": 176, "label": "Motor (Left)", "inputs": [{}] },
            case 176:
                if (PORT_AT(i+1) >= 100) {
                    GPIO_OUTPUT_SET(4,1);
                    GPIO_OUTPUT_SET(5,0);
                } else if (PORT_AT(i+1) <= -100) {
                    GPIO_OUTPUT_SET(4,0);
                    GPIO_OUTPUT_SET(5,1);
                } else {
                    GPIO_OUTPUT_SET(4,0);
                    GPIO_OUTPUT_SET(5,0);
                }
                i += 2;
                break;

///// { "op": 177, "label": "Motor (Right)", "inputs": [{}] },
            case 177:
                if (PORT_AT(i+1) >= 100) {
                    GPIO_OUTPUT_SET(7,1);
                    GPIO_OUTPUT_SET(8,0);
                } else if (PORT_AT(i+1) <= -100) {
                    GPIO_OUTPUT_SET(7,0);
                    GPIO_OUTPUT_SET(8,1);
                } else {
                    GPIO_OUTPUT_SET(7,0);
                    GPIO_OUTPUT_SET(8,0);
                }
                i += 2;
                break;

///// { "op": 178, "label": "LEDs", "inputs": [{ "label": "R", "type": "bool" }, { "label": "G", "type": "bool" }, { "label": "B", "type": "bool" }] },
            case 178:
                GPIO_OUTPUT_SET(16, PORT_AT(i+1) <= 0 ? 1 : 0);
                GPIO_OUTPUT_SET(2, PORT_AT(i+3) <= 0 ? 1 : 0);
                i += 4;
                break;

///// { "op": 224, "label": "Add", "inputs": [{}, {}], "outputs": [{}] },
            case 224:
                PORT_AT(i+3) = PORT_AT(i+1) + PORT_AT(i+2);
                i += 4;
                break;

///// { "op": 225, "label": "Subtract", "inputs": [{}, {}], "outputs": [{}] },
            case 225:
                PORT_AT(i+3) = PORT_AT(i+1) - PORT_AT(i+2);
                i += 4;
                break;

///// { "op": 226, "label": "Multiply", "inputs": [{}, {}], "outputs": [{}] },
            case 226:
                PORT_AT(i+3) = (int16_t)((int32_t)PORT_AT(i+1) * PORT_AT(i+2) / 100);
                i += 4;
                break;

///// { "op": 227, "label": "Divide", "inputs": [{}, {}], "outputs": [{}] },
            case 227:
                PORT_AT(i+3) = (int16_t)((int32_t)PORT_AT(i+1) * 100 / PORT_AT(i+2));
                i += 4;
                break;

///// { "op": 228, "label": "Maximum", "inputs": [{}, {}], "outputs": [{}] },
            case 228:
                PORT_AT(i+3) = MAX(PORT_AT(i+1), PORT_AT(i+2));
                i += 4;
                break;

///// { "op": 229, "label": "Minimum", "inputs": [{}, {}], "outputs": [{}] },
            case 229:
                PORT_AT(i+3) = MIN(PORT_AT(i+1), PORT_AT(i+2));
                i += 4;
                break;

///// { "op": 230, "label": "Flip-flop", "inputs": [{"label":"S","type":"bool"}, {"label":"R","type":"bool"}], "outputs": [{"label":"Q","type":"bool"}, {"label":"Q","type":"bool","invert":true}] },
            case 230:
                if (PORT_AT(i+1) > PORT_AT(i+2)) {
                    PORT_AT(i+3) = 100; PORT_AT(i+4) = 0;
                } else if (PORT_AT(i+1) < PORT_AT(i+2)) {
                    PORT_AT(i+3) = 0; PORT_AT(i+4) = 100;
                } else if (PORT_AT(i+3) == 0) {
                    PORT_AT(i+4) = 100;
                } else if (PORT_AT(i+4) == 0) {
                    PORT_AT(i+3) = 100;
                }
                i += 5;
                break;

///// { "op": 231, "label": "Compare", "inputs": [{}, {}], "outputs": [{"label":"<","type":"bool"},{"label":"=","type":"bool"},{"label":">","type":"bool"}] },
	    case 231:
                PORT_AT(i+3) = PORT_AT(i+1) < PORT_AT(i+2);
                PORT_AT(i+4) = PORT_AT(i+1) == PORT_AT(i+2);
                PORT_AT(i+5) = PORT_AT(i+1) > PORT_AT(i+2);
                i += 6;
                break;

///// { "op": 232, "label": "And", "inputs": [{"type":"bool"}, {"type":"bool"}], "outputs": [{"type":"bool"}] },
            case 232:
                PORT_AT(i+3) = PORT_AT(i+1) && PORT_AT(i+2);
                i += 4;
                break;

///// { "op": 233, "label": "Or", "inputs": [{"type":"bool"}, {"type":"bool"}], "outputs": [{"type":"bool"}] },
            case 233:
                PORT_AT(i+3) = PORT_AT(i+1) || PORT_AT(i+2);
                i += 4;
                break;

///// { "op": 234, "label": "Not", "inputs": [{"type":"bool"}], "outputs": [{"type":"bool"}] },
            case 234:
                PORT_AT(i+2) = !PORT_AT(i+1);
                i += 3;
                break;

///// { "op": 235, "label": "If/Then/Else", "inputs": [{"type":"bool"}, {}, {}], "outputs": [{}] },
	    case 235:
                PORT_AT(i+4) = PORT_AT(i+1) ? PORT_AT(i+2) : PORT_AT(i+3);
                i += 5;
                break;

///// { "op": 255, "label": "Variable", "outputs": [{}], "variable": true },
///// { "op": 255, "label": "Variable", "outputs": [{ "type": "bool"}], "variable": true }
            case 255:
                PORT_AT(i+1) = ((int16_t)prog->codes[i+2] << 8) + prog->codes[i+3];
                i += 4;
                break;

            default:
                return;
        }
        prog->ports[0] = 0;
    }
}
///// ]   
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
