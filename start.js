const app = require('./src/app'),
      service = require('./src/service'),
      config = require('./src/config');

const port = config.get('express.port');
const host = config.get('express.host');

service.up().then(() => {
  app.listen(port, host, () => {
    console.log(`API server is running at ${host}:${port}`);
  });
}).catch((e) => {
  console.error('Failed to start application', e);
});
