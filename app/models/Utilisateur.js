const mongoose = require('mongoose');
const crypto = require('crypto');

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
  password: {
    type: String,
    required: true,
    trim: true
  },
  salt: {
    type: String,
    required: true
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
    ref: 'MessageAbstrait'
  }],
  messagesRecus: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageAbstrait'
  }]
});
utilisateurSchema.methods.setPassword = function() {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = crypto.pbkdf2Sync(this.password, this.salt, 310000, 32, 'sha256').toString('hex');
};
utilisateurSchema.methods.validatePassword = function(password) {
  const hashedPassword = crypto.pbkdf2Sync(password, this.salt, 310000, 32, 'sha256').toString('hex');
  return this.password === hashedPassword;
};
module.exports = mongoose.model('Utilisateur', utilisateurSchema);
