/* Stub user_main.c based on the esphttpd/user/user_main.c ...
I'll add bits back in as I need them ... */

#include <esp8266.h>
#include "httpd.h"
#include "httpdespfs.h"
#include "espfs.h"
#include "webpages-espfs.h"
#include "../vm/virtual.h"
#include <eagle_soc.h>

virtual_prog_t VM = {{0}};


int ICACHE_FLASH_ATTR cgiDump(HttpdConnData *connData) {
    char buf[2000];
    virtual_dump_hex(&VM, buf);

    httpdStartResponse(connData, 200);
    httpdHeader(connData, "content-type", "text/plain");
    httpdEndHeaders(connData);
    httpdSend(connData, buf, virtual_dump_hex_size(&VM));
    return HTTPD_CGI_DONE;
}

int ICACHE_FLASH_ATTR cgiExec(HttpdConnData *connData) {
    virtual_exec(&VM);
    return cgiDump(connData);
}

int ICACHE_FLASH_ATTR cgiLoadBin(HttpdConnData *connData) {
    virtual_load_bin(&VM, (uint8_t *)connData->post->buff, (unsigned)connData->post->buffLen);
    return cgiExec(connData);
}

int ICACHE_FLASH_ATTR cgiLoadHex(HttpdConnData *connData) {
    virtual_load_hex(&VM, connData->post->buff, (unsigned)connData->post->buffLen);
    return cgiExec(connData);
}


HttpdBuiltInUrl builtInUrls[]={
    {"/", cgiRedirect, "/index.html"},
    {"/load/bin", cgiLoadBin, NULL},
    {"/load/hex", cgiLoadHex, NULL},
    {"/exec", cgiExec, NULL},
    {"/dump", cgiDump, NULL},
    {"*", cgiEspFsHook, NULL},
    {NULL, NULL, NULL}
};

static os_timer_t vmExecTimer;

void vmExecCb() {
    virtual_exec(&VM);
}

void user_init(void) {
    const char ssid[32] = "ZOIC3";
    const char password[64] = "dormouse";

    struct station_config stationConf = {{0}};

    wifi_set_opmode( STATION_MODE );
    os_memset(stationConf.ssid, 0, 32);
    os_memset(stationConf.password, 0, 64);
    stationConf.bssid_set = 0;
    os_memcpy(&stationConf.ssid, ssid, 32);
    os_memcpy(&stationConf.password, password, 64);
    wifi_station_set_config(&stationConf);
    wifi_station_connect();

    wifi_station_dhcpc_start();

    espFsInit((void*)(webpages_espfs_start));
    httpdInit(builtInUrls, 80);

    os_timer_disarm(&vmExecTimer);
    os_timer_setfn(&vmExecTimer, vmExecCb, NULL);
    os_timer_arm(&vmExecTimer, 20, 1);

    gpio_init();
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTDI_U, FUNC_GPIO12);
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTCK_U, FUNC_GPIO13);
    PIN_FUNC_SELECT(PERIPHS_IO_MUX_MTMS_U, FUNC_GPIO14);
    //WRITE_PERI_REG(RTC_GPIO_CONF, READ_PERI_REG(RTC_GPIO_CONF) & ~1);
    //WRITE_PERI_REG(RTC_GPIO_ENABLE, (READ_PERI_REG(RTC_GPIO_ENABLE) & ~1) | out_en);

}
