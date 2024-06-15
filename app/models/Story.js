const mongoose = require('mongoose');
const cron = require('node-cron');

const storySchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  contenu: {
    type: {
      type: String,
      enum: ['texte', 'image', 'vidéo'],
      required: true
    },
    texte: {
      type: String,
      trim: true,
      maxlength: 255
    },
    image: {
      type: String // URL ou chemin d'accès au fichier image
    },
    video: {
      type: String // URL ou chemin d'accès au fichier vidéo
    },
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateExpiration: {
    type: Date,
    default: () => new Date(+new Date() + 24 * 60 * 60 * 1000)
  
  },
  vues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }],
});

// Middleware pour la suppression automatique des stories expirées
/* storySchema.post('save', async function(story) {
  const expirationDelay = story.dateExpiration - Date.now();

  // Déclenche une tâche cron pour supprimer la story à l'expiration
  cron.schedule('expire', async () => {
    try {
      await Story.findByIdAndDelete(story._id);
      console.log(`Story ${story._id} supprimée avec succès.`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la story ${story._id} :`, error);
    }
  }, {
    start: false,
    delay: expirationDelay
  });
}); */

module.exports = mongoose.model('Story', storySchema);
