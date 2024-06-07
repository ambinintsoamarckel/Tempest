const mongoose = require('mongoose');

const groupeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true
  },
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  membres: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageGroupe' // Référence à MessageGroupe
  }]
});

module.exports = mongoose.model('Groupe', groupeSchema);
