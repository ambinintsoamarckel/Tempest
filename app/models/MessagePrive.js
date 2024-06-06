const mongoose = require('./MessageAbstrait'); // Importez le modèle abstrait

const messagePriveSchema = new MessagePrive.schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  reponseA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: false
  }
});

module.exports = messagePriveSchema.model('MessagePrive');
