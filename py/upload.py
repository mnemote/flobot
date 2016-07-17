#!/usr/bin/env python

import serial
import time
from sys import argv

port = serial.Serial("/dev/ttyUSB0", 115200)

fh = open(argv[1], "r")

port.write('_fh = open(%s, "w")\r' % repr(argv[2]))

while True:
    s = fh.read(50)
    if len(s) == 0: break
    port.write("_fh.write(%s)\r" % repr(s))
    time.sleep(0.1)

port.write('_fh.close()\r')

port.close()
