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
/* loadFixture(); */
 
  async function getMessagesPrives() {
    try {
      const messagesPrives = await MessageAbstrait.find({ type: 'MessagePrive' }).populate('expediteur destinataire reponseA');
      return messagesPrives;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages privés :', error);
    }
  }
  async function getMessagesDeGroupe() {
    try {
      const messagesDeGroupe = await MessageAbstrait.find({ type: 'MessageGroupe' }).populate('expediteur groupe reponseA');
      return messagesDeGroupe;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages de groupe :', error);
    }
  }

  db.close();




















});

module.exports = db;
