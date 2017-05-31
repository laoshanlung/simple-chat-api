const express = require('express'),
      router = express.Router(),
      service = require('../service'),
      authenticated = require('./auth').authenticated;

function checkAuthor() {
  return (req, res, next) => {
    const {
      id
    } = Object.assign({}, req.query, req.args, req.params);

    const {
      token
    } = req;

    service.getMessageById(id).then((message) => {
      if (!message) return res.jsonError({
        code: 400,
        message: 'Message not found',
        data: {
          id
        }
      });

      // assuming that we always have the user because of authenticated middleware
      if (message.userId !== token.user.id) return res.jsonError({
        code: 403,
        message: 'Unauthorized access',
        data: {
          id
        }
      });

      next();
    }).catch((error) => {
      res.jsonError({
        code: 400,
        message: 'Failed to check access',
        data: null
      });
    });
  };
}

router.get('/', (req, res) => {
  service.getMessages(req.query.limit).then(res.jsonData, res.jsonError);
});

router.post('/', authenticated(), (req, res) => {
  const token = req.token;
  service.createMessage(req.body.content, token.user.id).then(res.jsonData, res.jsonError);
});

router.delete('/:id(\\d+)', authenticated(), checkAuthor(), (req, res) => {
  service.deleteMessage(parseInt(req.params.id, 10)).then(res.jsonData, res.jsonError);
});

router.put('/:id(\\d+)', authenticated(), checkAuthor(), (req, res) => {
  service.updateMessage(parseInt(req.params.id, 10), req.body.content).then(res.jsonData, res.jsonError);
});

module.exports = router;
