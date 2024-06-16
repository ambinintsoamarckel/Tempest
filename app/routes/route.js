const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/UtilisateurController');
const messageController = require('../controllers/MessageController');
const groupeController = require('../controllers/GroupeController');
const storyController = require('../controllers/StoryController');
var passport = require('passport');

// Middleware pour les routes protégées
const protectedRoutes = require('./protectedRoutes');

const routes = (app) => {
  app.route('/dernierConversation')
    .get(protectedRoutes, utilisateurController.recupererContactsEtMessages);

  app.route('/utilisateurs')
    .post(utilisateurController.creerUtilisateur)
    .get(utilisateurController.VoirTousUtilisateur);

  app.route('/utilisateurs/:id')
    .get(protectedRoutes, utilisateurController.recupererUtilisateur)
    .put(protectedRoutes, utilisateurController.modifierUtilisateur)
    .delete(protectedRoutes, utilisateurController.supprimerUtilisateur);

  app.route('/me')
    .get(protectedRoutes, utilisateurController.recupererMonCompte)
    .put(protectedRoutes, utilisateurController.modifierMonCompte)
    .delete(protectedRoutes, utilisateurController.supprimerMonCompte);

  app.route('/session')
    .get(protectedRoutes, utilisateurController.recupererSession);

  app.route('/messages/personne/:contactId')
    .post(protectedRoutes, utilisateurController.envoyerMessageAPersonne)
    .get(protectedRoutes, utilisateurController.recupererDiscussionAvecContact);

  app.route('/messages/groupe/:groupeId')
    .post(protectedRoutes, utilisateurController.envoyerMessageAGroupe)
    .get(protectedRoutes, utilisateurController.recupererDiscussionAvecGroupe);

  app.route('/stories')
    .post(protectedRoutes, utilisateurController.ajouterStory);

  app.route('/stories/:storyId')
    .delete(protectedRoutes, utilisateurController.supprimerStory);

  // Routes pour messages
  app.route('/messages')
    .post(protectedRoutes, messageController.creerMessage);

  app.route('/messages/:id')
    .get(protectedRoutes, messageController.recupererMessage)
    .put(protectedRoutes, messageController.modifierMessage)
    .delete(protectedRoutes, messageController.supprimerMessage);

  // Routes pour groupes
  app.route('/groupes')
    .post(protectedRoutes, groupeController.creerGroupe)
    .get(protectedRoutes, groupeController.VoirTousLesGroupe);

  app.route('/groupes/:id')
    .get(protectedRoutes, groupeController.recupererGroupe)
    .put(protectedRoutes, groupeController.modifierGroupe)
    .delete(protectedRoutes, groupeController.supprimerGroupe);

  app.route('/groupes/:id/membres/:utilisateurId')
    .post(protectedRoutes, groupeController.ajouterMembre)
    .delete(protectedRoutes, groupeController.retirerMembre);

  app.route('/groupes/:id/messages')
    .post(protectedRoutes, groupeController.envoyerMessageGroupe)
    .get(protectedRoutes, groupeController.recupererMessagesGroupe);

  app.route('/stories')
    .post(protectedRoutes, storyController.creerStory);

  app.route('/stories/:id')
    .get(protectedRoutes, storyController.recupererStory)
    .delete(protectedRoutes, storyController.supprimerStory);
};

module.exports = routes;
