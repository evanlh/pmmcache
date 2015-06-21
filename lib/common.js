var _ = require('lodash');

exports.defaultOpts = function defaultOpts(self, opts){
    self.opts = {
        port: 'tcp://127.0.0.1:9000',
        ackTimeout: 1000, // in ms
        defaultExpiration: 24*60*60*1000 // in ms
    };
    if (typeof opts == 'object'){
        _.assign(self.opts, opts);
    }
    if (typeof opts == 'string'){
        self.opts.port = opts;
    }
};
