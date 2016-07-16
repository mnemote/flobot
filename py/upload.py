#!/usr/bin/env python

import serial
import time
from sys import argv

port = serial.Serial("/dev/ttyUSB0", 115200)

fh = open(argv[1], "r")

port.write('with open(%s, "w") as fh:\r' % repr(argv[2]))

while True:
    s = fh.read(100)
    if len(s) == 0: break
    port.write("fh.write(%s)\r" % repr(s))

port.write('\r' * 3)

time.sleep(5)

port.setDTR(False)
port.setRTS(False)
time.sleep(0.5)
port.setDTR(True)
port.setRTS(True)

port.close()
