var pmm = require('../lib/'),
    cluster = require('cluster'),
    port = 'tcp://127.0.0.1:3333';
    // port = 'inproc://mymemcache';

if (cluster.isMaster){
  for (var i = 0; i < 5; i ++) cluster.fork();

  var server = new pmm.Server(port);
  server.start();
  var lastCount = 0;
  setInterval(function(){
    var count = Object.keys(server._cache).length;
    console.log("object count: " + count + ", wps: " + (count - lastCount));
    lastCount = count;
  }, 1000);
}
else {
    var client = new pmm.Client(port);
    client.connect();
    var i = 0,
        lastCombined = [];
    var onError = function(err){
      if (err) console.log(err);
    };

  // setInterval(function(){
  while (1){
    var combined = [i, i];
    client.set(process.pid + "-" + combined.join("-"), combined, 24*60*1000, onError);
    i++;
    combined = null;
  }
  // }, 0);

}
