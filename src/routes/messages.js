const express = require('express'),
      router = express.Router(),
      service = require('../service');

router.get('/', (req, res) => {
  service.getMessages(req.query.limit).then(res.jsonData, res.jsonError);
});

router.post('/', (req, res) => {
  service.createMessage(req.body.content).then(res.jsonData, res.jsonError);
});

router.delete('/:id(\\d+)', (req, res) => {
  service.deleteMessage(parseInt(req.params.id, 10)).then(res.jsonData, res.jsonError);
});

router.put('/:id(\\d+)', (req, res) => {
  service.updateMessage(parseInt(req.params.id, 10), req.body.content).then(res.jsonData, res.jsonError);
});

module.exports = router;
