const express = require('express');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const crypto = require('crypto');
const Utilisateur = require('../models/Utilisateur');
const router = express.Router();

passport.use(new LocalStrategy(
  async function verify(username, password, cb) {
    try {
      const user = await Utilisateur.findOne({ email: username });
      
      if (!user) {
        return cb(null, false, { message: 'Incorrect email.' });
      }
      
      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) { return done(err); }
        if (!crypto.timingSafeEqual(Buffer.from(user.password, 'hex'), hashedPassword)) {
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
  cb(null, {
    id: user.id,
    email: user.email,
    nom: user.nom,
    photo: user.photo
  });
});

passport.deserializeUser(async function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  res.status(200).json(req.user);
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return res.status(500).json({ message: 'Logout failed' }); }
    res.status(200).json({ message: 'Logged out' });
  });
});

router.post('/signup', async (req, res) => {
  try {
    const utilisateur = new Utilisateur(req.body);
    utilisateur.setPassword(req.body.motDePasse);
    await utilisateur.save();
    res.status(201).json(utilisateur);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
