-- flobot.lua ... lets try implementing in lua ...

-- SETUP

wifi.setmode(wifi.STATION)
wifi.sta.config('nfone','farnarkle')

-- VIRTUAL MACHINE


-- WEB SERVER

function receiver(client, request)

    if request:find('POST /prog/hex ') then 

      client:send('HTTP/1.0 200 OK\r\n\r\n')
      client:send('Argh!');

    elseif request:find('GET /port/hex ') then

      client:send('HTTP/1.0 200 OK\r\n\r\n')
      client:send('hello, world');

    else

      local path = request:match('GET (%S+)');
      print('>>>>>' .. path .. '<<<<<');
      if path:sub(-1) == '/' then path = path .. 'index.html' end

      if file.open('files' .. path) then 
        client:send('HTTP/1.0 200 OK\r\n\r\n')
        while true do
          local data = file.read(100);
          if not data then break end
          client:send(data);
        end
      else
        client:send('HTTP/1.0 404 NOT FOUND\r\n\r\n')
      end

    end

    client:close();
end

function run_webserver()
  print(wifi.sta.getip())
  srv = net.createServer(net.TCP)
  srv:listen(80, function(conn)
    conn:on("receive", receiver)
  end)
end

tmr.alarm(1, 5000, 0, run_webserver)
