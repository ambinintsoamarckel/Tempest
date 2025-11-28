const express = require('express');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const crypto = require('crypto');
const Utilisateur = require('../models/Utilisateur');
const router = express.Router();
const UtilisateurService = require('../services/UtilisateurService');
const { getIo } = require('../../config/socketConfig');
const { default: mongoose } = require('mongoose');

passport.use(new LocalStrategy(
  async function verify(username, password, cb) {
    try {
      const user = await Utilisateur.findOne({ email: username });

      if (!user) {
        return cb(null, false, { message: 'E-mail incorrect.' });
      }

      crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) { return cb(err); }
        if (!crypto.timingSafeEqual(Buffer.from(user.password, 'hex'), hashedPassword)) {
          return cb(null, false, { message: 'Mot de passe incorrect.' });
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
    _id: user.id,
    email: user.email,
    nom: user.nom,
    photo: user.photo,
    presence: user.presence
  });
});

passport.deserializeUser(async function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

// ✅ Route pour le login
router.post('/login', (req, res, next) => {
  console.log('login eto');
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) { return res.status(401).json(info); }

    req.logIn(user, async (err) => {
      if (err) { return next(err); }

      // Mettre à jour la présence à "en ligne" après une connexion réussie
      try {
        await user.UpdatePresence();

        // Envoyer la notification Socket.IO
        let io = getIo();
        io.emit('userStatusChanged', {
          userId: user.id,
          status: 'online',
          user: req.user
        });

        // ✅ req.logIn() génère automatiquement le cookie de session
        // Pas besoin de l'ajouter manuellement
        res.status(200).json({
          user: req.user
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Échec de la mise à jour de la présence' });
      }
    });
  })(req, res, next);
});

// ✅ Route pour le logout
router.post('/logout', async (req, res) => {
  try {
    const user = await mongoose.model('Utilisateur').findById(req.user._id);
    // await user.setInactif(); // Décommente si tu veux gérer la présence

    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'La déconnexion a échoué' });
      }

      // Détruire la session
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de la destruction de la session' });
        }

        res.status(200).json({ message: 'Déconnecté' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du logout' });
  }
});

// ✅ Route pour le signup
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
