# Poor Man's Memcache
Extremely basic implementation of a memcached-like client/server using ZeroMQ.

## Why?
No great reason. Have to deploy in Windows where memcached isn't well supported, redis is an extra moving part when all I want is to share some buffers between Node threads.
