const _ = require('lodash'),
      yaml = require('js-yaml');

let nconf = require('nconf');

const env = process.env.NODE_ENV || 'development';

module.exports = nconf.env({
  separator: '__',
  lowerCase: true,
  logicalSeparator: '.'
}).file('env-configs', {
  file: `${__dirname}/config.${env}.yml`,
  format: {
    parse: yaml.safeLoad,
    stringify: yaml.safeDump
  },
  logicalSeparator: '.'
}).file('default-configs', {
  file: `${__dirname}/config.yml`,
  format: {
    parse: yaml.safeLoad,
    stringify: yaml.safeDump
  },
  logicalSeparator: '.'
});
