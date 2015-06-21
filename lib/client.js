var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('lodash'),
    zmq = require('zmq'),
    common = require('./common');

function Client(opts){
    EventEmitter.call(this);
    common.defaultOpts(this, opts);

    this._cid = process.pid + ":";
    this._mid = 0;
    this._msgQueue = {};
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
    this.socket.on('message', self.message);
};

Client.prototype.message = function(data){
    console.log(data);
};

Client.prototype.get = function get(key, callback){
    
};

Client.prototype.set = function set(key, value, lifetime, callback){
    if (typeof lifetime == 'function') {
        callback = lifetime;
        lifetime = null;
    }

    this._mid++;
    var msgid = this._cid + this._mid;
    var msg = ['set', msgid, key.toString(), value];
    if (lifetime) msg.push(lifetime.toString());

    this._msgQueue[msgid] = setTimeout(function(){
        callback(new Error('Ack timeout: ' + msgid), null);
    }, this.opts.ackTimeout);

    this.socket.send(msg);
};
