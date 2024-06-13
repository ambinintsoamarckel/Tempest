const express = require('express');
const app = express();
const db = require('../config/db'); // Importer la configuration de la base de données
var passport = require('passport');
var session = require('express-session');
var AuthRoute = require('../app/routes/Auth');
var crypto= require('crypto');
const bodyParser= require('body-parser');
const cors =require('cors');


const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

const secret = generateSecret();
var corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions)); 

// bodyparser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Se connecter à la base de données avant de démarrer le serveur
db.once('open', () => {
  // Configurer les middleware
/*   app.use(express.json()); // Parse les requêtes JSON
  app.use(express.urlencoded({ extended: true })); // Parse les requêtes POST
  if (secret) {
    app.use(session({
      secret,
      resave: false,
      saveUninitialized: false
    }));
  }

  // Initialisation de Passport (si nécessaire)
  if (passport) {
    app.use(passport.initialize());
    app.use(passport.session());
  } */

  // Définir les routes
  app.use('/',AuthRoute);
  require('../app/routes/route')(app);  // Importer et utiliser les routes définies dans routes.js

  // Démarrer le serveur
  app.listen(3000, () => console.log('Serveur Express démarré sur le port 3000'));
});
