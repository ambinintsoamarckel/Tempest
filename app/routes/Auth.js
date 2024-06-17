const express = require('express');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const crypto = require('crypto');
const Utilisateur = require('../models/Utilisateur');
const router = express.Router();
const UtilisateurService= require('../services/UtilisateurService');

// Configurer Passport
passport.use(new LocalStrategy(
  async function verify(username, password, cb) {
    try {
      const user = await Utilisateur.findOne({ email: username });
      
      if (!user) {
        return cb(null, false, { message: 'Incorrect email.' });
      }
      
      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) { return cb(err); }
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

// Route pour le login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) { return res.status(401).json(info); }
    req.logIn(user, (err) => {
      if (err) { return next(err); }

      // Mettre à jour la présence à "en ligne" après une connexion réussie
      user.presence = 'en ligne';
      user.save()
        .then(() => res.status(200).json(req.user))
        .catch(error => res.status(500).json({ message: 'Échec de la mise à jour de la présence' }));
    });
  })(req, res, next);
});

// Route pour le logout
router.post('/logout', async (req, res) => {
  user= await UtilisateurService.findUtilisateurById(req.user.id);
  user.presence = 'inactif';
  user.save().catch(error => res.status(500).json({ message: 'Presence update failed' }));
  req.logout((err) => {
    if (err) { return res.status(500).json({ message: 'Logout failed' }); }

    // Mettre à jour la présence à "inactif" avant le logout
    res.status(200).json({ message: 'Logged out' });
  

  });
});

// Route pour le signup
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
