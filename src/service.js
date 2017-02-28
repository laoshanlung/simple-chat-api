const sqlite = require('sqlite'),
      Promise = require('bluebird'),
      xssFilters = require('xss-filters');

module.exports = {
  getMessages(limit = 50) {
    return sqlite.all(`
      SELECT * FROM messages LIMIT ?
    `, [limit]);
  },

  createMessage(content) {
    if (!content) return Promise.reject('Missing content');

    content = xssFilters.inHTMLData(content);

    return sqlite.run(`
      INSERT INTO messages(content) VALUES (?)
    `, [content]).then((stm) => {
      return sqlite.get(`
        SELECT * FROM messages WHERE id = ?
      `, [stm.lastID]);
    });
  },

  deleteMessage(id) {
    return sqlite.run(`
      DELETE FROM messages WHERE id = ?
    `, [id]).then((stm) => {
      return {id};
    });
  },

  updateMessage(id, content) {
    if (!content) return Promise.reject('Missing content');

    content = xssFilters.inHTMLData(content);

    return sqlite.run(`
      UPDATE messages
      SET content = ?
      WHERE id = ?
    `, [content, id]).then((stm) => {
      return sqlite.get(`
        SELECT * FROM messages WHERE id = ?
      `, [id]);
    });
  },

  up() {
    return sqlite.open(`${__dirname}/chat.sqlite`, {Promise}).then(() => {
      return sqlite.migrate({
        migrationsPath: `${__dirname}/migrations`
      });
    });
  }
}
