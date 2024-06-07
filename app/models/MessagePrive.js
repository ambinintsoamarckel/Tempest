const mongoose = require('mongoose');
const MessageAbstrait = require('./MessageAbstrait');

const messagePriveSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  reponseA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageAbstrait', // Référence à MessageAbstrait
    required: false
  }
});

const MessagePrive = MessageAbstrait.discriminator('MessagePrive', messagePriveSchema);

module.exports = MessagePrive;
