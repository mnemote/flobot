try:
    import machine
    port = machine.UART(0, 115200)
except ImportError:
    import serial
    port = serial.Serial("/dev/ttyUSB0", baudrate=115200, timeout=0)

import time


def initialize():
    time.sleep(5)
    buf = bytearray([
        0xC6, 0x01,        # Enable reporting of ambient light pin
        0xF4, 0x09, 0x00,  # pin  9 = digital in (line left)
        0xF4, 0x0A, 0x00,  # pin 10 = digital in (line right)
        0xD1, 0x01,        # enable reporting of digital pins
        0xF4, 0x04, 0x01,  # pin  4 = digital out (motor 2 dir)
        0xF4, 0x05, 0x03,  # pin  5 = pwm out (motor 2 pwm)
        0xF4, 0x06, 0x03,  # pin  6 = pwm out (motor 1 pwm)
        0xF4, 0x07, 0x01,  # pin  7 = digital out (motor 1 dir)
    ])
    while buf:
        x = port.write(buf)
        buf = buf[x:]

def listener(vlocals):
    buf = b""
    vlocals["line_left"] = 0
    vlocals["line_right"] = 0
    vlocals["ambient"] = 0

    while True:
        r = port.read()
        if r: buf += r
        if buf:
            if buf[0] == '\x91':
                if len(buf) >= 3:
                    vlocals["line_left"] = ord(buf[1]) & 0x02 != 0
                    vlocals["line_right"] = ord(buf[1]) & 0x04 != 0
                    buf = buf[3:]
            elif buf[0] == '\xe6':
                if len(buf) >= 3:
                    vlocals["ambient"] = ord(buf[2]) * 128 + ord(buf[1])
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
        while buf:
            x = port.write(buf)
            buf = buf[x:]
            yield

if __name__ == "__main__":
    v = {}
    l = listener(v)
    while True:
        l.send(None)
        print(repr(v))
