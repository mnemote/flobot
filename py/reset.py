#!/usr/bin/env python

import serial
import time

port = serial.Serial("/dev/ttyUSB0", 115200)

port.setDTR(False)
port.setRTS(False)
time.sleep(0.5)
port.setDTR(True)
port.setRTS(True)

port.close()
