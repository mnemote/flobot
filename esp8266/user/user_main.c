/* Stub user_main.c based on the esphttpd/user/user_main.c ...
I'll add bits back in as I need them ... */

#include <esp8266.h>
#include "httpd.h"
#include "httpdespfs.h"
#include "espfs.h"
#include "webpages-espfs.h"
#include "../vm/virtual.h"
#include "cgi.h" 

virtual_prog_t *VM;

HttpdBuiltInUrl builtInUrls[]={
	{"/", cgiRedirect, "/index.html"},
	{"/load/bin", cgiLoadBin, NULL},
	{"/load/hex", cgiLoadHex, NULL},
	{"*", cgiEspFsHook, NULL},
	{NULL, NULL, NULL}
};

void user_init(void) {
	espFsInit((void*)(webpages_espfs_start));
	httpdInit(builtInUrls, 80);
}
