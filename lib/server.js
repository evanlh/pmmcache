var zmq = require('zmq'),
    common = require('./common');

function Server(opts){
    common.defaultOpts(this, opts);

    /*
     * Objects in cache:
     * cache[key] = { k: key, v: value, e: expiration_timestamp };
     */
    this._cache = {};
    this._socket = zmq.socket('rep');
    this._socket.identity = 'pmmServer' + process.pid;
};
module.exports = Server;

Server.prototype.start = function start(callback){
    var self = this;
    this._socket.bind(this.opts.port, function(err){
        if (typeof callback == 'function') callback(err);

        self._socket.on('message', self.message.bind(self));
    });
};

Server.prototype.message = function message(action){
    var args = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
    console.log('server message');
    action = action.toString();
    console.log(args);
    if (action == 'set'){
        this.set.apply(this, args);
    } else if (action == 'get'){
        this.get.apply(this, args);
    }
    // this._socket.send('ok');
};

Server.prototype.set = function set(msgid, key, value, lifetime){
    msgid = msgid && msgid.toString();
    key = key && key.toString();
    if (!key){
        this._socket.send([msgid, 'Missing key']);
        return;
    }

    lifetime = lifetime && parseInt(lifetime.toString())
                        || this.opts.defaultExpiration;

    var expires_on = Date.now() + lifetime;
    console.log(msgid, key, value, expires_on);
    var obj = {
        v: value,
        e: expires_on
    };
    this._cache[key] = obj;
    this._socket.send([msgid, 'ok']);
};

Server.prototype.get = function get(msgid, key){
    msgid = msgid && msgid.toString();
    key = key && key.toString();
    if (!key){
        this._socket.send([msgid, 'Missing key']);
        return;
    }
    var value = this._cache[key] && this._cache[key].v || null;
    this._socket.send([msgid, 'ok', value]);
};

Server.prototype.stop = function stop(){
};

