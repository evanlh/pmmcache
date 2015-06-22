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
    var interval = setInterval(function(){
        client.set(i + '', i, 1000, function(err){
            console.log('set i to ' + i);
            console.log(err);
        });
        client.get(i + '', function(err, response){
            console.log('got i for ' + i);
            console.log(err, response);
        });

        i++;
    }, 100);

    setTimeout(function(){ clearInterval(interval); }, 1000);

}
