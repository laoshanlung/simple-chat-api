const express = require('express'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      config = require('./config'),
      jwt = require('express-jwt'),
      cors = require('cors');

const app = express();
app.use(cors({
  origin: config.get('web.url'),
  credentials: true
}));
app.disable('x-powered-by');
app.enable('trust proxy');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.jsonData = function(data) {
    return res.json({data, error: null, success: true});
  };

  res.jsonError = function(error, status = 400) {
    return res.status(status).json({
      data: null,
      error: error,
      success: false
    });
  };

  next();
});

app.use(jwt({
  secret: config.get('auth.secret'),
  requestProperty: 'token',
  credentialsRequired: false,
  getToken: function fromHeaderOrQuerystring (req) {
    return req.cookies.token;
  }
}));

app.use('/api/messages', require('./routes/messages'));
app.use('/auth', require('./routes/auth'));

app.get('/status', (req, res) => {
  res.end('Ok');
});

module.exports = app;
