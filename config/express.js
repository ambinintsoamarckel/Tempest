const express = require('express');
const app = express();
const db = require('../config/db'); // Importer la configuration de la base de données

// Se connecter à la base de données avant de démarrer le serveur
db.once('open', () => {
  // Configurer les middleware
  app.use(express.json()); // Parse les requêtes JSON
  app.use(express.urlencoded({ extended: true })); // Parse les requêtes POST

  // Définir les routes
  require('./routes')(app); // Importer et utiliser les routes définies dans routes.js

  // Démarrer le serveur
  app.listen(3000, () => console.log('Serveur Express démarré sur le port 3000'));
});
