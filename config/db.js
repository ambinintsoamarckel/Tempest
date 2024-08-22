const mongoose = require('mongoose');
const loadFixture= require('../app/fixtures/Fixtures')
const dbUrl = 'mongodb+srv://mahm:mahm@cluster0.qaxiuic.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';// Remplacez par votre URL de connexion
//const dbUrl = 'mongodb://mahm:mahm@127.0.0.1:27017/Tempest?retryWrites=true&w=majority&serverSelectionTimeoutMS=2000&appName=mongosh+2.2.6';
const MongoStore = require('connect-mongo');
mongoose.connect(dbUrl, {
  dbName: 'Tempest',
  autoCreate: true

});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erreur de connexion à la base de données :'));
db.once('open', async () => {
console.info('********* Connexion à la base de données réussie ! **********')
loadFixture();     
});
const sessionStore = new MongoStore({ mongoUrl: dbUrl });
module.exports = {
  db,
  sessionStore
};

