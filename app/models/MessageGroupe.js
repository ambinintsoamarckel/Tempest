const mongoose = require('mongoose');
const MessageAbstrait = require('./MessageAbstrait');

const messageGroupeSchema = new mongoose.Schema({
  groupe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groupe',
    required: true
  },
  reponseA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageAbstrait', // Référence à MessageAbstrait
    required: false
  }
});

const MessageGroupe = MessageAbstrait.discriminator('MessageGroupe', messageGroupeSchema);

module.exports = MessageGroupe;
