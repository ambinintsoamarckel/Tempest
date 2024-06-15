const mongoose = require('mongoose');

const messageAbstraitSchema = new mongoose.Schema({
  contenu: {
    type: {
      type: String,
      enum: ['texte', 'image', 'fichier'],
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
    fichier: {
      type: String // URL ou chemin d'accès au fichier
    }
  },
  expediteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  dateEnvoi: {
    type: Date,
    default: Date.now
  },
  reponseA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageAbstrait', // Référence à MessageAbstrait
    required: false
  }
}, { discriminatorKey: 'type', collection: 'messages' });



const MessageAbstrait = mongoose.model('MessageAbstrait', messageAbstraitSchema);

module.exports = MessageAbstrait;
