start bin\redis\redis-server bin\redis\redis.windows.conf --loglevel warning

set NODE_ENV=production

bin\node\node app.js >out.txt

pause
