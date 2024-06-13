const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const Utilisateur = require('../models/Utilisateur');

passport.use(new LocalStrategy(
function verify(username, password, cb) {
    try {
      const user = Utilisateur.findOne({ email: username });
      if (!user) {
        return cb(null, false, { message: 'Incorrect email.' });
      }

      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) { return done(err); }
        if (!crypto.timingSafeEqual(Buffer.from(user.hashed_password, 'hex'), hashedPassword)) {
          return cb(null, false, { message: 'Incorrect password.' });
        }
        return cb(null, user);
      });
    } catch (err) {
      return cb(err);
    }
  }
));

passport.serializeUser(function(user, cb) {
  cb(null,{
    id: user.id,
    username: user.username,
    picture: user.picture
  });
});

passport.deserializeUser(async function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

module.exports = passport;
