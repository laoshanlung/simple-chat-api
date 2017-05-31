const sqlite = require('sqlite'),
      Promise = require('bluebird'),
      xssFilters = require('xss-filters'),
      _ = require('lodash'),
      changeCase = require('change-case'),
      faye = require('./faye');

function changeAllKeysToCamelCase(row) {
  if (_.isArray(row)) {
    return row.map(changeAllKeysToCamelCase);
  } else if (_.isObject(row)) {
    return _.chain(row).toPairs().map((pair) => {
      const key = pair[0];
      const value = pair[1];

      return [changeCase.camelCase(key), changeAllKeysToCamelCase(value)];
    }).fromPairs().value();
  }

  return row;
}

function formatMessage (row) {
  return {
    id: row.id,
    content: row.content,
    created: row.created,
    user: _.pick(row, [
      'display_name',
      'profile_url',
      'avatar_url'
    ])
  };
}

module.exports = {
  getMessageById(id) {
    return sqlite.get(`
      SELECT * FROM messages WHERE id = ?
    `, [id]).then(changeAllKeysToCamelCase);
  },

  getMessages(limit = 50) {
    return sqlite.all(`
      SELECT m.id, m.content, m.created,
        u.display_name,
        u.profile_url,
        u.avatar_url
      FROM messages m
      JOIN users u ON u.id = m.user_id
      ORDER BY m.created DESC
      LIMIT ?
    `, [limit]).map(formatMessage).then(changeAllKeysToCamelCase);
  },

  createMessage(content, userId) {
    if (!content) return Promise.reject('Missing content');

    content = xssFilters.inHTMLData(content);

    return sqlite.run(`
      INSERT INTO messages(content, user_id) VALUES (?, ?)
    `, [content, userId]).then((stm) => {
      return sqlite.get(`
        SELECT m.id, m.content, m.created,
          u.display_name,
          u.profile_url,
          u.avatar_url
        FROM messages m
        JOIN users u ON u.id = m.user_id
        WHERE m.id = ?
      `, [stm.lastID]);
    }).then(formatMessage).then(changeAllKeysToCamelCase).tap((message) => {
      faye.publish('/messages', {
        event: 'receivedMessage',
        payload: message
      });
    });
  },

  deleteMessage(id) {
    faye.publish('/messages', {
      event: 'deletedMessage',
      payload: {id}
    });

    return sqlite.run(`
      DELETE FROM messages WHERE id = ?
    `, [id]).then((stm) => {
      return {id};
    });
  },

  updateMessage(id, content) {
    if (!content) return Promise.reject('Missing content');

    content = xssFilters.inHTMLData(content);

    faye.publish('/messages', {
      event: 'updateMessage',
      payload: {id, content}
    });

    return sqlite.run(`
      UPDATE messages
      SET content = ?
      WHERE id = ?
    `, [content, id]).then((stm) => {
      return sqlite.get(`
        SELECT * FROM messages WHERE id = ?
      `, [id]);
    }).then(changeAllKeysToCamelCase);
  },

  upsertUser({loginType, loginId, displayName, avatarUrl, profileUrl}) {
    return sqlite.get(`
      SELECT * FROM users
      WHERE login_type = ?
      AND login_id = ?
    `, [loginType, loginId]).then((row) => {
      if (row) {
        return sqlite.run(`
          UPDATE users SET
          avatar_url = ?,
          display_name = ?,
          profile_url = ?
          WHERE id = ?
        `, [
          avatarUrl,
          displayName,
          profileUrl,
          row.id
        ]).then(() => {
          return Object.assign(row, {
            avatarUrl,
            profileUrl,
            displayName
          });
        });
      }

      return sqlite.run(`
        INSERT INTO users (
          login_type,
          login_id,
          avatar_url,
          profile_url,
          display_name
        ) VALUES (
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `, [
        loginType,
        loginId,
        avatarUrl,
        profileUrl,
        displayName
      ]).then((stm) => {
        return sqlite.get(`
          SELECT * FROM messages WHERE id = ?
        `, [stm.lastID]);
      });
    }).then(changeAllKeysToCamelCase);
  },

  up() {
    return sqlite.open(`${__dirname}/chat.sqlite`, {Promise}).then(() => {
      return sqlite.migrate({
        migrationsPath: `${__dirname}/migrations`
      });
    });
  }
}
