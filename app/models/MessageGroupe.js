const mongoose = require('./MessageAbstrait'); // Importez le modèle abstrait

const messageGroupeSchema = new MessagePrive.schema({
  groupe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groupe',
    required: true
  },
  reponseA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: false
  }
});

module.exports = messageGroupeSchema.model('MessageGroupe');
