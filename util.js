'use strict';

// logging datetime, status, message
var log = function(status, msg){
    var dt = new Date();
    console.log('['+dt+']['+status+'] '+msg);
}

module.exports.log = log;

//STATUS MESSAGES
module.exports.ERROR = "ERROR";