// VM headers

#ifndef VIRTUAL_H
#define VIRTUAL_H

#include <stdint.h>
#include <stddef.h>

typedef float vport_t;

typedef enum vinst_e {
    ADD,
    SUB,
    MUL,
    DIV,
    CMP,
} vinst_t;

typedef struct __attribute__((packed)) vcode_s { 
    vinst_t inst:6;
    unsigned int vport_a:13;
    unsigned int vport_b:13;
} vcode_t;    

void virtual_execute(vport_t *vports, int n_vports, vcode_t *vcodes, int n_vcodes);
#endif
