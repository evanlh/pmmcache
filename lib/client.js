var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('lodash'),
    zmq = require('zmq'),
    msgpack = require('msgpack5')(),
    common = require('./common');

function Client(opts){
    EventEmitter.call(this);
    common.defaultOpts(this, opts);

    this._cid = process.pid + ":";
    this._mid = 0;

    // _callbackQueue imposes async semantics over the zmq
    // alternating req/rep model
    this._callbackQueue = [];

    this.socket = zmq.socket('req');
    this.socket.identity = 'pmmClient' + process.pid;
    this.monitor();
}

util.inherits(Client, EventEmitter);
module.exports = Client;

Client.prototype.monitor = function monitor(){
    var self = this;
    function reemit(type){
        return function(fd, ep){
            self.emit(type, fd, ep);
        };
    };
    this.socket.on('connect', reemit('connect'));
    this.socket.on('connect_delay', reemit('connect_delay'));
    this.socket.on('connect_retry', reemit('connect_retry'));
    this.socket.on('disconnect', reemit('disconnect'));
    this.socket.on('close', reemit('close'));
    this.socket.on('close_error', reemit('close_error'));
};

Client.prototype.connect = function connect(callback){
    var self = this;
    this.socket.connect(this.opts.port);
    setImmediate(function(){
        if (typeof(callback) == 'function') callback(self.socket);
    });
    this.socket.on('message', self.message.bind(self));
};

/*
 * Response header: { m: 'ok' || 'error message text' }
 */
Client.prototype.message = function(header, value){
    var cb = this._callbackQueue.shift();
    var headerObj = msgpack.decode(header);
    var valueObj = value && msgpack.decode(value) || undefined;
    console.log(this.socket.identity + ' response');
    if (headerObj.m == 'ok'){
        if (typeof cb == 'function'){
            cb(null, valueObj);
        }
    }
    else {
        var error = new Error(headerObj.m);
        cb(error, valueObj);
    }
};

/*
 * Get header: { a: 'get', k: key }
 */
Client.prototype.get = function get(key, callback){
    if (typeof key != 'string') {
        throw new Error('Only string keys allowed in this version');
    }
    var header = { a: 'get', k: key };
    this._callbackQueue.push(callback);
    console.log(this.socket.identity + ' get');
    this.socket.send(msgpack.encode(header));
};

/*
 * Set header: { a: 'set', k: key, l: lifetime }
 */
Client.prototype.set = function set(key, value, lifetime, callback){
    if (typeof lifetime == 'function') {
        callback = lifetime;
        lifetime = null;
    }
    var timestamp = Date.now();
    var header = { a: 'set', k: key, l: lifetime, t: timestamp };
    var msg = [msgpack.encode(header), msgpack.encode(value)];
    this._callbackQueue.push(callback);
    console.log(this.socket.identity + ' set');
    this.socket.send(msg);
};
