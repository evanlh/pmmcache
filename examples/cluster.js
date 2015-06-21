var pmm = require('../lib/'),
    cluster = require('cluster'),
    port = 'tcp://127.0.0.1:3333';

if (cluster.isMaster){
    for (var i = 0; i < 2; i ++) cluster.fork();

    var server = new pmm.Server(port);
    server.start();
}
else {
    var client = new pmm.Client(port);
    client.connect();
    var i = 0;
    setInterval(function(){
        client.set(i, i, 1000, function(err, response){
            console.log(err, response);
        });
        i++;
    }, 100);

    setInterval(function(){
        client.get(i, function(err, response){
            console.log(err, response);
        });
    }, 200);
}
