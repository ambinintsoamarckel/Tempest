const mongoose = require('mongoose');
const cron = require('node-cron');
const fs = require('fs');
const path=require('path');
const storySchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  contenu: {
    type: {
      type: String,
      enum: ['texte', 'image', 'video'],
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
  active: {
    type: Boolean,
    default: true
  }
});
// Middleware pour supprimer les fichiers associés avant de supprimer le document
storySchema.pre('deleteOne', async function(next) {
  try {
   
    const Model = this.model;
    const story =  await Model.findOne(this.getFilter());
    if (story.contenu && ['image', 'video'].includes(story.contenu.type)) {
      const filePath = path.join(__dirname, '../../', story.contenu[story.contenu.type].split('3000/')[1]);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Erreur lors de la suppression du fichier ${filePath} :`, err);
        } else {
          console.log(`Fichier ${filePath} supprimé avec succès.`);
        }
      });
    }
    next();
  } catch (error) {
    console.error('Erreur lors de la suppression des fichiers associés :', error);
    next(error);
  }
});
storySchema.methods.setInactif = async function() {
  try {
    const Utilisateur = mongoose.model('Utilisateur');
    const user = await Utilisateur.findById(this.utilisateur);

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    if(this.active)
      {
    // Vérifier si la story est déjà archivée
    const isArchived = user.archives.some(storyId => storyId.equals(this._id));
    const isActive = user.stories.some(storyId => storyId.equals(this._id));

    if (!isArchived && isActive) {
      // Ajouter la story à l'archive de l'utilisateur
      user.archives.push(this._id);
      // Supprimer la story de la propriété stories
      user.stories = user.stories.filter(storyId => !storyId.equals(this._id));
      // Sauvegarder les modifications
      await user.save();


      console.log('Story archivée avec succès');
    } else {
      console.log('La story est déjà archivée ou non présente dans les stories actives');
    }
    this.active = false;
    await this.save();
      }
  } catch (error) {
    console.error('Erreur lors de l\'archivage de la story:', error);
  }
};

module.exports = mongoose.model('Story', storySchema);
