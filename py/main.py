import usocket as socket
import machine
import ure
import time
import json
import os

import mbot

buf = []
http_header_re = ure.compile(r"(\w+) (\S+) (HTTP/1.[01])\s*$")

crlf = b"\r\n"

prog = ""
prog_loc = {}
prog_glo = {}

prog_run = False

def web_server(addr='0.0.0.0', port=80):
  srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  srv.bind((addr, port))
  srv.listen(5)
  srv.setblocking(False)

  print("Listening on %s:%s" % (addr, port))

  workers = []
  while True:
    try:
      sck, rem = srv.accept()
      workers.append(web_server_worker(sck, rem))
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

def web_server_worker(sck, rem):
  sck.setblocking(False)

  print("Got connection from %s %s" % rem)
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

      print("%s %s %s" % (http_method, http_request, http_version))

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
        x = sck.read(req_content_length - len(req_body))
        if x: req_body += x
        yield
     
      http_status, res_headers, res_body = handle_request(
        http_method,
        http_request,
        req_headers,
        req_body
      )

      if type(res_body) not in (str, bytes) and b'Content-Length' not in res_headers:
        keep_alive = False
      elif http_version == b'HTTP/1.0':
        keep_alive = req_headers.get(b'Connection','').lower() == b'keep-alive'
      else:
        keep_alive = req_headers.get(b'Connection','').lower() != b'close'

      keep_alive = False

      res_headers[b'Connection'] = b'keep-alive' if keep_alive else b'close'
   
      dat = (
        b"%s %s %s" % (http_version, http_status, b"OK") + crlf +
        crlf.join(b"%s: %s" % (k, v) for k, v in res_headers.items()) +
        crlf + crlf
      )
       
      if hasattr(res_body, 'send'):
        try:
          while True:
            dat += res_body.send(None)
            x = sck.write(dat)
            if x:
              dat = dat[x:]
            yield
        except StopIteration:
          pass
      elif hasattr(res_body, 'read'):
        while True:
          if len(dat) < 1000:
            s = res_body.read(1000)
            if not s: break
            dat += s
          x = sck.write(dat)
          if x:
            dat = dat[x:]
          yield
      else:
        dat += res_body
      while dat:
        yield
        x = sck.write(dat)
        if x: 
          dat = dat[x:]
      if not keep_alive:
        sck.close()
        return
  except Exception as e:
    sck.close()
    print(repr(e))
    #raise(e)

def handle_request(http_method, http_request, req_headers, req_body):
  if http_method == b'GET':
    try:
      filename = b"www/" + http_request if http_request != b"/" else b"www/index.html";
      s = os.stat(filename);
      http_status = 200
      print("Sending %s (%d bytes)" % (filename, s[6]))

      return 200, {b'Content-Length': b'%d' % s[6]}, open(filename, "rb")
    except OSError:
      http_status = 404
      res_body = b"Not found"
  elif http_method == b'POST':
    if req_body:
      prog = req_body.decode('utf-8')
    try:
      exec(prog, prog_glo, prog_loc)
      http_status = 200
      res_body = json.dumps(prog_loc).encode('utf-8')
    except Exception as e:
      http_status = 400
      res_body = str(e).encode('utf-8')
  else:
    http_status = 405
    res_body = b"Bad Method"
  res_headers = {
    b'Content-Length': b'%d' % len(res_body),
    b'Access-Control-Allow-Origin': b'*'
  }
  return http_status, res_headers, res_body


def executor():
  while True:
    if prog:
      try:
        exec(prog, prog_glo, prog_loc)
        del prog_loc["_exception"]
      except Exception as e:
        prog_loc["_exception"] = str(e).encode('utf-8')
    yield

def loop():
  mbot.initialize()
  tasks = [
    web_server('0.0.0.0', 80),
    mbot.talker(prog_loc),
    mbot.listener(prog_loc),
    executor(),
  ]

  while True:
    for t in tasks:
      t.send(None)

loop()
