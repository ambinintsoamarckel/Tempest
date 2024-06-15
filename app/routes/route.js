const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/UtilisateurController');
const messageController = require('../controllers/MessageController');
const groupeController = require('../controllers/GroupeController');
const storyController = require('../controllers/StoryController');
var passport = require('passport');


const routes = (app) => {

  // Import the protectedRoutes middleware
  const protectedRoutes = require('./protectedRoutes'); // Assuming the middleware is in a file named protectedRoutes.js

    app.route('/derniereDiscu')
    .get(protectedRoutes, utilisateurController.recupererContactsEtMessages); // Apply protectedRoutes middleware

    app.route('/utilisateurs')
    .post(utilisateurController.creerUtilisateur) // Apply protectedRoutes middleware
    .get(utilisateurController.VoirTousUtilisateur);

    app.route('/utilisateurs/:id')
    .get(protectedRoutes, utilisateurController.recupererUtilisateur) // Apply protectedRoutes middleware
    .put( utilisateurController.modifierUtilisateur) // Apply protectedRoutes middleware
    .delete(protectedRoutes, utilisateurController.supprimerUtilisateur); // Apply protectedRoutes middleware

    app.route('/me')
    .get(protectedRoutes, utilisateurController.recupererMonCompte) // Apply protectedRoutes middleware
    .put(protectedRoutes, utilisateurController.modifierMonCompte) // Apply protectedRoutes middleware
    .delete(protectedRoutes, utilisateurController.supprimerMonCompte);

    app.route('/session')
    .get(protectedRoutes, utilisateurController.recupererSession); // Apply protectedRoutes middleware

    
    app.route('/utilisateurs/:id/discussion/:contactId')
    .get(protectedRoutes, utilisateurController.recupererDiscussionAvecContact); // Apply protectedRoutes middleware

    app.route('/utilisateurs/:id/amis/:amiId')
    .post(protectedRoutes, utilisateurController.ajouterAmi); // Apply protectedRoutes middleware

    app.route('/utilisateurs/:id/messages')
    .post(protectedRoutes, utilisateurController.envoyerMessage); // Apply protectedRoutes middleware

    app.route('/messages')
    .post(protectedRoutes, messageController.creerMessage); // Apply protectedRoutes middleware

    app.route('/messages/:id')
    .get(protectedRoutes, messageController.recupererMessage) // Apply protectedRoutes middleware
    .put(protectedRoutes, messageController.modifierMessage) // Apply protectedRoutes middleware
    .delete(protectedRoutes, messageController.supprimerMessage); // Apply protectedRoutes middleware


    app.route('/groupes')
    .post(protectedRoutes, groupeController.creerGroupe) // Apply protectedRoutes middleware
    .get(protectedRoutes, groupeController.VoirTousLesGroupe); // Apply protectedRoutes middleware

    app.route('/groupes/:id')
    .get(protectedRoutes, groupeController.recupererGroupe) // Apply protectedRoutes middleware
    .put(protectedRoutes, groupeController.modifierGroupe) // Apply protectedRoutes middleware
    .delete(protectedRoutes, groupeController.supprimerGroupe); // Apply protectedRoutes middleware

    app.route('/groupes/:id/membres/:utilisateurId')
    .post(protectedRoutes, groupeController.ajouterMembre) // Apply protectedRoutes middleware
    .delete(protectedRoutes, groupeController.retirerMembre); // Apply protectedRoutes middleware
    
    app.route('/groupes/:id/messages')
    .post(protectedRoutes, groupeController.envoyerMessageGroupe) // Apply protectedRoutes middleware
    .get(protectedRoutes, groupeController.recupererMessagesGroupe); // Apply protectedRoutes middleware

    app.route('/stories')
    .post(protectedRoutes, storyController.creerStory); // Apply protectedRoutes middleware

    app.route('/stories/:id')
    .get(protectedRoutes, storyController.recupererStory) // Apply protectedRoutes middleware
    .delete(protectedRoutes, storyController.supprimerStory); // Apply protectedRoutes middleware

        
}

module.exports = routes;
