const cron = require('node-cron');
const mongoose = require('mongoose'); // Importation de mongoose pour la connexion à la base de données

// Modèle utilisateur
const Utilisateur = mongoose.model('Utilisateur'); // Remplacez par le chemin d'accès à votre modèle utilisateur
const Story = mongoose.model('Story'); // Remplacez par le chemin d'accès à votre modèle story
const { getIo } = require('./socketConfig');

let io;


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
    if(utilisateursEnLigneInactifs?.length>0)
      {
        for (const utilisateur of utilisateursEnLigneInactifs) {
          await utilisateur.setInactif();
        }
        io = getIo();
        console.log("me inactif");
        io.emit('utilisateur_modifie');

      }


  } catch (error) {
    console.error('Erreur lors de la recherche ou de la mise à jour de la présence des utilisateurs :', error);
  }
}
async function checkAndUpdateStories() {
  try {
    // Rechercher toutes les stories actives dont la date d'expiration est passée
    const storiesExpirees = await Story.find({
      active: true,
      dateExpiration: { $lte: new Date() }
    });
    if(storiesExpirees?.length>0)
    {
    // Parcourir chaque story expirée et appeler setInactif
    for (const story of storiesExpirees) {
      await story.setInactif();
    }
    io = getIo();
    io.emit('story_expire');
      }


  } catch (error) {
    console.error('Erreur lors de la vérification ou de la mise à jour des stories :', error);
  }
}
async function task() {
  checkAndUpdatePresence();
  checkAndUpdateStories();

}


module.exports=task;
