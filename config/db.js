const mongoose = require('mongoose');
const Utilisateur = require('../app/models/Utilisateur');
const Groupe = require('../app/models/Groupe');
const MessagePrive = require('../app/models/MessagePrive');
const MessageGroupe = require('../app/models/MessageGroupe');
const MessageAbstrait= require('../app/models/MessageAbstrait');
const Story = require('../app/models/Story');
const loadFixture= require('../app/fixtures/Fixtures')

const dbUrl = 'mongodb+srv://mahm:mahm@cluster0.qaxiuic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Remplacez par votre URL de connexion

mongoose.connect(dbUrl, {
  dbName: 'Tempest',
  autoCreate: true

});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Erreur de connexion à la base de données :'));

db.once('open', async () => {
  console.log('Connexion à la base de données réussie !');
/*  loadFixture();  */
 
 
/*   db.close(); */

});

module.exports = db;
