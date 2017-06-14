#!/bin/bash
ssh dokku@tannguyen.org apps:create simple-chat-api
tar --exclude='src/chat.sqlite' -cv src package.json start.js -C .dokku CHECKS | ssh dokku@tannguyen.org tar:in simple-chat-api
