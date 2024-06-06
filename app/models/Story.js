const mongoose = require('mongoose');

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
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateExpiration: {
    type: Date,
    required: true
  },
  vues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }],

}});

module.exports = mongoose.model('Story', storySchema);
