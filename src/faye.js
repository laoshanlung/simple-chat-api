const faye = require('faye'),
      deflate = require('permessage-deflate'),
      config = require('./config');

const client = new faye.Client(config.get('faye.url'));
client.addWebsocketExtension(deflate);

const clientAuth = {
  outgoing: function(message, callback) {
    if (message.channel !== '/messages') return callback(message);

    message.ext = message.ext || {};
    message.ext.secret = config.get('faye.secret');
    callback(message);
  }
};

client.addExtension(clientAuth);

module.exports = client;
