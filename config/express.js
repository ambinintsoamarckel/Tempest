const express = require('express');
const app = express();
const {db,sessionStore}= require('../config/db'); // Importer la configuration de la base de données
var passport = require('passport');
var session = require('express-session'); // Importer le middleware de session
var AuthRoute = require('../app/routes/Auth');
var crypto= require('crypto');
const bodyParser= require('body-parser');
const cors =require('cors');


const generateSecret = () => {
  //return crypto.randomBytes(32).toString('hex');
  return process.env.SESSION_SECRET || 'Mon-secret-qui-tue';
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
  secret: secret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: false, // Mettre à true en production avec HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 jour
  }
};

// Appliquer le middleware de session
app.use(session(sessionConfig)); 
app.use(passport.session());
app.use('/',AuthRoute);
require('../app/routes/route')(app); 


// Se connecter à la base de données avant de démarrer le serveur
db.once('open', () => {

  // Définir les routes
  // Importer et utiliser les routes définies dans routes.js

  // Démarrer le serveur
  app.listen(3000, () => console.log('Serveur Express démarré sur le port 3000'));
});
