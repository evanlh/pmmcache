var zmq = require('zmq'),
    msgpack = require('msgpack5')(),
    JSONB = require('json-buffer'),
    common = require('./common');


msgpack.encode = function(v){
  return JSON.stringify(v);
};
msgpack.decode = function(v){
  return JSONB.parse(v);
};

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

Server.prototype.message = function message(header, value){
    var headerObj = msgpack.decode(header);

    if (headerObj.a === 'set'){
        this.set(headerObj, value);
    }
    else if (headerObj.a === 'get'){
        this.get(headerObj);
    }
    else {
        var response = { m: 'invalid request' };
        this._socket.send(response);
    }
};

Server.prototype.set = function set(header, value){
    var lifetime = header.l || this.opts.defaultExpiration,
        timestamp = header.t,
        key = header.k,
        response = {};

    var expires_on = Date.now() + lifetime;

    if (this._cache[key] && this._cache[key].t > timestamp) {
        response.m = 'out of sequence';
    }
    else {
        var obj = {
            v: value,
            e: expires_on,
            t: timestamp
        };
        this._cache[key] = obj;
        response.m = 'ok';
    }
    this._socket.send(msgpack.encode(response));
};

Server.prototype.get = function get(header){
    var key = header.k,
        value = this._cache[key] && this._cache[key].v || null,
        response = {};

    response.m = 'ok';
    this._socket.send([msgpack.encode(response), value]);
};

Server.prototype.stop = function stop(){
};

