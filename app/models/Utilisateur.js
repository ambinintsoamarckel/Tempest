const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  motDePasse: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: null
  },
  presence: {
    type: String,
    enum: ['en ligne', 'inactif'],
    default: 'inactif'
  },
  amis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }],
  groupes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groupe'
  }],
  messagesEnvoyes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  messagesRecus: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }]
});

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
