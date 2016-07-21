import usocket as socket
import machine
import ure
import time
import json
import os

buf = []
http_header_re = ure.compile(r"(\w+) (\S+) (HTTP/1.[01])\s*$")

doc = """<html><img src="/foo.jpg"></html>"""

crlf = "\r\n"

uart = machine.UART(0, 115200)

prog = None
prog_loc = {}
prog_glo = { "uart": uart, "time": time }
prog_run = False

def web_server(addr='0.0.0.0', port=80):
  srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  srv.bind((addr, port))
  srv.listen(5)
  srv.setblocking(False)

  workers = []
  while True:
    try:
      sck, rem = srv.accept()
      workers.append(web_server_worker(sck))
    except OSError:
      yield

    for ww in workers[:]:
      try:
        ww.send(None)
        yield
      except StopIteration:
        workers.remove(ww)
    else:
      yield

def web_server_worker(sck):
  sck.setblocking(False)
  try:
    while True:
      req = sck.readline()
      yield
      if req is None: continue
      m = http_header_re.match(req)
      if not m:
        sck.close()
        break
      http_method, http_request, http_version = m.group(1), m.group(2), m.group(3)
      req_headers = {}
      while True:
        line = sck.readline()
        yield
        if line is None: continue
        line = line.strip()
        if not line: break
        k, v = line.split(b': ', 1)
        req_headers[k.lower()] = v
      req_content_length = int(req_headers.get(b'content-length',0))
      req_body = b''
      while len(req_body) < req_content_length:
        req_body += sck.read(req_content_length - len(req_body))
        yield
     
      http_status, res_headers, res_body = handle_request(
        http_method,
        http_request,
        req_headers,
        req_body
      )

      if type(res_body) not in (str, bytes) and 'Content-Length' not in res_headers:
        keep_alive = False
      elif http_version == 'HTTP/1.0':
        keep_alive = req_headers.get(b'connection','').lower() == b'keep-alive'
      else:
        keep_alive = req_headers.get(b'connection','').lower() != b'close'
      res_headers['Connection'] = 'Keep-Alive' if keep_alive else 'Close'
   
      dat = (
        "%s %s %s" % (http_version, http_status, "OK") + crlf +
        crlf.join("%s: %s" % (k, v) for k, v in res_headers.items()) +
        crlf + crlf
      ).encode('utf-8')
       
      if hasattr(res_body, 'send'):
        try:
          while True:
            dat += res_body.send(None)
            x = sck.write(dat)
            dat = dat[x:]
            yield
        except StopIteration:
          pass
      elif hasattr(res_body, 'read'):
        while True:
          if len(dat) < 500:
            s = res_body.read(50)
            if not s: break
            dat += s
          x = sck.write(dat)
          dat = dat[x:]
          yield
      else:
        dat += res_body
      while dat:
        yield
        x = sck.write(dat)
        dat = dat[x:]
      if not keep_alive:
        sck.close()
        return
  except Exception as e:
    sck.close()
    print("ERROR: %s" % e)
    raise(e)

def handle_request(http_method, http_request, req_headers, req_body):
  if http_method == 'GET':
    try:
      filename = "www/" + http_request if http_request != "/" else "www/index.html";
      s = os.stat(filename);
      http_status = 200
      return 200, {'Content-Length': s[6]}, open(filename, "rb")
    except OSError:
      http_status = 404
      res_body = "Not found"
  elif http_method == 'POST':
    prog = req_body
    print(prog)
    try:
      exec(prog, prog_glo, prog_loc)
      http_status = 200
      res_body = json.dumps(prog_loc)
    except Exception as e:
      http_status = 500
      res_body = str(e).encode('utf-8')
  else:
    http_status = 400
    res_body = "Bad Request"
  res_headers = {
    'Content-Length': len(res_body),
    'Access-Control-Allow-Origin': '*'
  }
  return http_status, res_headers, res_body


def uart_reader():
  while True:
    r = uart.read()
    if r is not None: buf.append(r)
    yield

def uart_writer():
  while True:
    msg = repr(prog_loc)
    while msg:
      x = uart.write(msg)
      msg = msg[x:]
      yield

def executor():
  while True:
    if prog:
      exec(prog, prog_glo, prog_loc)
      prog_run = True
    yield

def loop():
  tasks = [
    web_server('0.0.0.0', 80),
#    uart_reader(),
#    uart_writer(),
    #executor(),
  ]

  while True:
    for t in tasks:
      t.send(None)

loop()
