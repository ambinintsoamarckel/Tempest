const express = require('express');
const app = express();
const { db, sessionStore } = require('../config/db'); // Importer la configuration de la base de données
const passport = require('passport');
const session = require('express-session'); // Importer le middleware de session
const AuthRoute = require('../app/routes/Auth');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
const updatePresence = require('./tasks');
const cron = require('node-cron');
const path = require('path');

const generateSecret = () => {
  return process.env.SESSION_SECRET || 'Mon-secret-qui-tue';
};

const secret = generateSecret();

const corsOptions = {
  origin: '*' // Expose 'set-cookie' header to the client
};
// Middleware pour transformer l'en-tête Authorization en cookie
app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const cookieValue = authHeader.slice(7); // Retirer 'Bearer ' pour obtenir la valeur du cookie
    console.log('la valeur de cookie:',cookieValue);
    req.headers.cookie = `${cookieValue}`;
  }
  next();
});

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const staticFilesPath = path.join(__dirname, '../uploads'); // Chemin absolu vers le répertoire des fichiers statiques
app.use('/uploads', express.static(staticFilesPath));
console.log('Static files served from:', staticFilesPath);

// Configuration de la session
const sessionConfig = {
  secret: secret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: false,
    maxAge: 1000 * 60 * 60 * 24, // 1 jour
    sameSite: 'None' // Assurez-vous que SameSite est 'None' pour permettre les cookies cross-site
  },
};

// Appliquer le middleware de session
app.use(session(sessionConfig));
app.use(passport.session());
app.use('/', AuthRoute);
require('../app/routes/route')(app);

// Se connecter à la base de données avant de démarrer le serveur
db.once('open', () => {
  // Démarrer le serveur
  app.listen(3000, () => console.log('Serveur Express démarré sur le port 3000'));
  var task = cron.schedule('* * * * *', updatePresence);
});
