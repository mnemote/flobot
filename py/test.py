import sys
import logging
logging.basicConfig(level=0,stream=sys.stdout)

import xasyncio as asyncio

def handle(reader, writer):
    request_line = yield from reader.readline()
    print(request_line.decode())

loop = asyncio.get_event_loop()
loop.create_task(asyncio.start_server(handle, None, 23))
loop.run_forever()
loop.close()
