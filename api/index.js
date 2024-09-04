const express = require('express');
const http = require('http'); // Importer le module HTTP
const { initializeSocket } = require('../config/socketConfig'); 
const { db, sessionStore } = require('../config/db'); // Importer la configuration de la base de données
const passport = require('passport');
const session = require('express-session'); // Importer le middleware de session
const AuthRoute = require('../app/routes/Auth');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
const updatePresence = require('../config/tasks');
const cron = require('node-cron');
const path = require('path');

const app = express();
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
    req.headers.cookie = `${cookieValue}`;
  }
  next();
});

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const staticFilesPath = path.join(__dirname, '../uploads'); // Chemin absolu vers le répertoire des fichiers statiques
// Déplacer les fichiers dans le répertoire public
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

//app.use('../uploads', express.static(staticFilesPath));

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
const server = http.createServer(app); // Créer un serveur HTTP
initializeSocket(server);
// Appliquer le middleware de session
app.use(session(sessionConfig));
app.use(passport.session());
app.use('/', AuthRoute);
require('../app/routes/route')(app);


// Se connecter à la base de données avant de démarrer le serveur
db.once('open', () => {
  // Démarrer le serveur
  const PORT = process.env.PORT || 3002;
  server.listen(PORT, () => console.info(`********* Serveur Express démarré sur le port ${PORT} **********`));
  

  var task = cron.schedule('* * * * *', updatePresence);
});
module.exports=app;
