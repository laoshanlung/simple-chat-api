const passport = require('passport'),
      GitHubStrategy = require('passport-github2'),
      config = require('../config'),
      express = require('express'),
      router = express.Router(),
      service = require('../service'),
      jwt = require('jsonwebtoken');

passport.use(new GitHubStrategy({
    clientID: config.get('auth.github.id'),
    clientSecret: config.get('auth.github.secret'),
    callbackURL: `${config.get('api.url')}/auth/github/callback`
  },
  function(accessToken, refreshToken, profile, done) {
    const json = profile._json;

    const data = {
      loginType: 'github',
      loginId: json.login,
      avatarUrl: json.avatar_url,
      profileUrl: json.html_url,
      displayName: json.name
    };

    service.upsertUser(data).asCallback(done);
  }
));

router.get('/github', passport.authenticate('github'));

const failureRedirect = `${config.get('web.url')}/login`;
const successRedirect = `${config.get('web.url')}`;
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect, session: false }),
  function(req, res) {
    const token = jwt.sign({
      user: req.user
    }, config.get('auth.secret'), { expiresIn: '48h' });

    res.cookie('token', token, { maxAge: 48 * 3600 * 1000, httpOnly: true });
    res.redirect(successRedirect);
  }
);

router.get('/me', (req, res) => {
  const {
    token
  } = req;

  if (!token || !token.user || !token.user.id) return res.jsonData(null);

  res.jsonData(token.user);
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect(302, config.get('web.url'));
});

function authenticated() {
  return (req, res, next) => {
    const {
      token
    } = req;

    if (token && token.user && token.user.id) return next();

    res.jsonError({
      code: 403,
      message: 'Unauthenticated access',
      data: null
    }, 403);
  };
}

module.exports = router;
module.exports.authenticated = authenticated;
