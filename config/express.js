const express = require('express');
const app = express();
const db = require('../config/db'); // Importer la configuration de la base de données
var passport = require('passport');
var session = require('express-session'); // Importer le middleware de session
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuration de la session
const sessionConfig = {
  secret: secret, // Remplacer par votre clé secrète générée
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Définir sur true pour les environnements de production
};

// Appliquer le middleware de session
app.use(session(sessionConfig)); 
app.use(passport.session());


// Se connecter à la base de données avant de démarrer le serveur
db.once('open', () => {

  // Définir les routes
  app.use('/',AuthRoute);
  require('../app/routes/route')(app);  // Importer et utiliser les routes définies dans routes.js

  // Démarrer le serveur
  app.listen(3000, () => console.log('Serveur Express démarré sur le port 3000'));
});
