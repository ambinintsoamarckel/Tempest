const cron = require('node-cron');
const mongoose = require('mongoose'); // Importation de mongoose pour la connexion à la base de données

// Modèle utilisateur
const Utilisateur = mongoose.model('Utilisateur'); // Remplacez par le chemin d'accès à votre modèle utilisateur

// Définir le délai d'inactivité en minutes
const inactivityThreshold = 1;

// Fonction de recherche et de mise à jour de la présence
async function checkAndUpdatePresence() {
  try {
    // Rechercher tous les utilisateurs "en ligne" inactifs
    const utilisateursEnLigneInactifs = await Utilisateur.find({
      presence: 'en ligne',
      lastActivity: { $lte: Date.now() - inactivityThreshold * 60000 } // Requête MongoDB pour lastActivity
    });

    // Parcourir chaque utilisateur "en ligne" inactif
    for (const utilisateur of utilisateursEnLigneInactifs) {
      await utilisateur.setInactif();
    }
  } catch (error) {
    console.error('Erreur lors de la recherche ou de la mise à jour de la présence des utilisateurs :', error);
  }
}

module.exports=checkAndUpdatePresence;
