import usocket as socket
import machine
import ure
import time
buf = []
http_header_re = ure.compile(r"(\w+) (\S+) (HTTP/1.[01])\s*$")

doc = """<html><img src="/foo.jpg"></html>"""

def web_server(addr='0.0.0.0', port=80):
  srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  srv.bind((addr, port))
  srv.setblocking(False)
  srv.listen(5)

  workers = [ web_server_worker(srv) for _ in range(1,5) ]

  while True:
    for ww in workers:
      yield from ww

def web_server_worker(srv):
  while True:
    try:
      sck, rem = srv.accept()
      print('New connection from %s' % (rem,))
    except OSError:
      yield
      continue
    while True:
      req = sck.readline()
      yield
      if req is None: continue
      m = http_header_re.match(req)
      if not m:
        sck.close()
        break
      http_method, http_request, http_version = m.group(1), m.group(2), m.group(3)
      print("\t%s" % req)
      http_headers = {}
      while True:
        header_line = sck.readline()
        yield
        if header_line is None: continue
        header_line = header_line.strip()
        print("\t%s" % header_line)
        if not header_line: break
        k, v = header_line.split(b': ', 1)
        http_headers[k] = v
      keep_alive = (http_headers.get(b'Connection') == b'Keep-Alive') if (http_version == b'HTTP/1.0') else (http_headers.get(b'Connection') != b'Close')
      if http_method == 'GET':
        dat = doc.encode('utf-8')
        msg = b"HTTP/1.0 200 OK\r\nContent-Length: %d\r\nContent-Type: text/html\r\nConnection: %s\r\n\r\n" % ( len(dat), 'Keep-Alive' if keep_alive else 'Close' ) + dat
      elif http_method == 'POST':
        dat = b"".join(buf)
        buf.clear()
        msg = b"HTTP/1.0 200 OK\r\nContent-Length: %d\r\nConnection: %s\r\n\r\n" % ( len(dat), 'Keep-Alive' if keep_alive else 'Close' ) + dat
      else:
        msg = b"wot?"

      print(msg)
        
      while msg:
        x = sck.write(msg)
        msg = msg[x:]
        yield
      if not keep_alive:
        sck.close()
        break

def uart_reader():
  u = machine.UART(0, 115200)
  while True:
    r = u.read()
    if r is not None: buf.append(r)
    yield

def loop():
  a = web_server('0.0.0.0', 80)
  b = uart_reader()
  while True:
    a.send(None)
    b.send(None)

loop()
