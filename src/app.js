const express = require('express'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      config = require('./config');

const allowCors = (req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);

  next();
};

const app = express();
app.use(allowCors);
app.disable('x-powered-by');
app.enable('trust proxy');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.jsonData = function(data) {
    return res.json({data, error: null, success: true});
  };

  res.jsonError = function(error) {
    return res.status(400).json({
      data: null,
      error: error,
      success: false
    });
  };

  next();
});

app.use('/api/messages', require('./routes/messages'));

module.exports = app;
