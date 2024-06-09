const express = require('express');
const router = express.Router();
const utilisateurController = require('./controllers/UtilisateurController');
const messageController = require('./controllers/MessageController');
const groupeController = require('./controllers/GroupeController');
const storyController = require('./controllers/StoryController');

const routes = (app) => {

    app.route('/utilisateurs/:id/contacts-et-messages')
    .get((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },utilisateurController.recupererContactsEtMessages);

    app.route('/utilisateurs')
    .post((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },utilisateurController.creerUtilisateur)
    .get(utilisateurController.VoirTousUtilisateur);

    app.route('/utilisateurs/connexion')
    .post((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },utilisateurController.seConnecter);

    app.route('/utilisateurs/:id')
    .get((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },utilisateurController.recupererUtilisateur)
    .put(utilisateurController.modifierUtilisateur)
    .delete(utilisateurController.supprimerUtilisateur);
    
    app.route('/utilisateurs/:id/discussion/:contactId')
    .get((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },utilisateurController.recupererDiscussionAvecContact);

    app.route('/utilisateurs/:id/amis/:amiId')
    .post((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },utilisateurController.ajouterAmi);

    app.route('/utilisateurs/:id/messages')
    .post((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },utilisateurController.envoyerMessage);

    app.route('/messages')
    .post((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },messageController.creerMessage);

    app.route('/messages/:id')
    .get((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },messageController.recupererMessage)
    .put(messageController.modifierMessage)
    .delete(messageController.supprimerMessage);


    app.route('/groupes')
    .post((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },groupeController.creerGroupe)
    .get(groupeController.VoirTousLesGroupe);

    app.route('/groupes/:id')
    .get((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },groupeController.recupererGroupe)
    .put(groupeController.modifierGroupe)
    .delete(groupeController.supprimerGroupe);

    app.route('/groupes/:id/membres/:utilisateurId')
    .post((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },groupeController.ajouterMembre)
    .delete(groupeController.retirerMembre);
    
    app.route('/groupes/:id/messages')
    .post((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },groupeController.envoyerMessageGroupe)
    .get(groupeController.recupererMessagesGroupe);

    app.route('/stories')
    .post((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },storyController.creerStory);

    app.route('/stories/:id')
    .get((req, res, next) => {
        // middleware
        console.log(`Request de: ${req.originalUrl}`)
        console.log(`Request type: ${req.method}`)
        next();
    },storyController.recupererStory)
    .delete(storyController.supprimerStory);    
        
}

module.exports = routes;