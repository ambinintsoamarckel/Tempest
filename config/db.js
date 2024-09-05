const mongoose = require('mongoose');
const loadFixture= require('../app/fixtures/Fixtures')
require('dotenv').config();
const dbUrl = process.env.MONGODB_URL;// Remplacez par votre URL de connexion



const MongoStore = require('connect-mongo');
mongoose.connect(dbUrl, {
  dbName: 'Tempest',
  autoCreate: true

});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erreur de connexion à la base de données :'));
db.once('open', async () => {
console.info('********* Connexion à la base de données réussie ! **********')
//await loadFixture();     
});
const sessionStore = new MongoStore({ mongoUrl: dbUrl });
module.exports = {
  db,
  sessionStore
};

