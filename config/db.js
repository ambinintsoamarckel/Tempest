const mongoose = require('mongoose');

const dbUrl = 'mongodb+srv://marsonambinintsoa:fMtQ5pOMAsXifDKd@cluster0.qaxiuic.mongodb.net/Tempest?retryWrites=true&w=majority&appName=Cluster0'; // Remplacez par votre URL de connexion

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Erreur de connexion à la base de données :'));

db.once('open', () => console.log('Connexion à la base de données réussie !'));

module.exports = db;
