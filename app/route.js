const express = require('express');
const router = express.Router();
const utilisateurController = require('./controllers/UtilisateurController');
const messageController = require('./controllers/MessageController');
const groupeController = require('./controllers/GroupeController');
const storyController = require('./controllers/StoryController');

// Routes pour les utilisateurs
router.post('/utilisateurs/inscription', utilisateurController.creerUtilisateur);
router.post('/utilisateurs/connexion', utilisateurController.seConnecter);
router.get('/utilisateurs/:id', utilisateurController.recupererUtilisateur);
router.put('/utilisateurs/:id', utilisateurController.modifierUtilisateur);
router.delete('/utilisateurs/:id', utilisateurController.supprimerUtilisateur);

// Routes supplémentaires pour les utilisateurs
router.get('/utilisateurs/:id/contacts-et-messages', utilisateurController.recupererContactsEtMessages);
router.get('/utilisateurs/:id/discussion/:contactId', utilisateurController.recupererDiscussionAvecContact);
router.post('/utilisateurs/:id/amis/:amiId', utilisateurController.ajouterAmi);
router.post('/utilisateurs/:id/messages', utilisateurController.envoyerMessage);

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

// Routes supplémentaires pour les groupes
router.post('/groupes/:id/membres/:utilisateurId', groupeController.ajouterMembre);
router.delete('/groupes/:id/membres/:utilisateurId', groupeController.retirerMembre);
router.post('/groupes/:id/messages', groupeController.envoyerMessageGroupe);
router.put('/groupes/:id/createur', groupeController.changerCreateur);
router.get('/groupes/:id/messages', groupeController.recupererMessagesGroupe);

// Routes pour les stories
router.post('/stories', storyController.creerStory);
router.get('/stories/:id', storyController.recupererStory);
router.delete('/stories/:id', storyController.supprimerStory);

module.exports = router;
