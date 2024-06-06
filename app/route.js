const express = require('express');
const router = express.Router();
const utilisateurController = require('./controllers/utilisateurController');
const messageController = require('./controllers/messageController');
const groupeController = require('./controllers/groupeController');
const storyController = require('./controllers/storyController');

// Routes pour les utilisateurs
router.post('/utilisateurs/inscription', utilisateurController.creerUtilisateur);
router.post('/utilisateurs/connexion', utilisateurController.seConnecter);
router.get('/utilisateurs/:id', utilisateurController.recupererUtilisateur);
router.put('/utilisateurs/:id', utilisateurController.modifierUtilisateur);
router.delete('/utilisateurs/:id', utilisateurController.supprimerUtilisateur);

// Routes pour les messages
router.post('/messages', messageController.creerMessage);
router.get('/messages/:id', messageController.recupererMessage);
router.put('/messages/:id', messageController.modifierMessage);
router.delete('/messages/:id', messageController.supprimerMessage);

// Routes pour les groupes
router.post('/groupes', groupeController.creerGroupe);
router.get('/groupes/:id', groupeController.recupererGroupe);
router.put('/groupes/:id', groupeController.modifierGroupe);
router.delete('/groupes/:id', groupeController.supprimerGroupe);

// Routes pour les stories
router.post('/stories', storyController.creerStory);
router.get('/stories/:id', storyController.recupererStory);
router.delete('/stories/:id', storyController.supprimerStory);

module.exports = router;
