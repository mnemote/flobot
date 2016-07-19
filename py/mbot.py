try:
    import serial
    port = serial.Serial("/dev/ttyUSB0", baudrate=115200, timeout=0)
except ImportError:
    import machine
    port = machine.UART(0, 115200)

import time

time.sleep(5)

port.write(bytearray([
    0xF4, 0x04, 0x01,  # pin  4 = digital out (motor 2 dir)
    0xF4, 0x05, 0x03,  # pin  5 = pwm out (motor 2 pwm)
    0xF4, 0x06, 0x03,  # pin  6 = pwm out (motor 1 pwm)
    0xF4, 0x07, 0x01,  # pin  7 = digital out (motor 1 dir)
    0xF4, 0x09, 0x00,  # pin  9 = digital in (line left)
    0xF4, 0x0A, 0x00,  # pin 10 = digital in (line right)
    0xD1, 0x01,        # enable reporting of pins
]))

def listener(vlocals):
    buf = b""
    while True:
        buf += port.read()
        if buf:
            print repr(buf)
            if buf[0] == '\x91':
                if len(buf) >= 3:
                    vlocals["line_left"] = ord(buf[1]) & 0x02
                    vlocals["line_right"] = ord(buf[1]) & 0x04
                    buf = buf[3:]
            elif buf[0] == '\xe6':
                if len(buf) >= 3:
                    vlocals["ambient"] = ord(buf[2]) << 7 + ord(buf[1])
                    buf = buf[3:]
            else:
                buf = buf[1:]
        yield

def talker(vlocals):
    while True:
        ml = int(min(255, abs(vlocals.get("motor_left", 0) * 2.55)))
        dl = 1 if vlocals.get("motor_left", 0) < 0 else 0
        mr = int(min(255, abs(vlocals.get("motor_right", 0) * 2.55)))
        dr = 1 if vlocals.get("motor_right", 0) < 0 else 0

        buf = bytearray([
            #0xF5, 0x04, dl,
            0xE5, ml & 0x7F, ml >> 7,
            0xE6, mr & 0x7F, mr >> 7,
            #0xF5, 0x07, dr,
            0x90, (dl << 4), dr
        ])
        print repr(buf)
        while buf:
            x = port.write(buf)
            buf = buf[x:]
            yield

v = {}
l = listener(v)
t = talker(v)

while True:
    l.send(None)
    t.send(None)

    v["motor_left"] = -50 if v.get("line_left") else +75
    v["motor_right"] = -50 if v.get("line_right") else +75

    print repr(v)
