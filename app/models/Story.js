const mongoose = require('mongoose');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const bucket = require('../../config/firebaseConfig');

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
    // ✅ Nouveaux champs pour les stories texte stylisées
    backgroundColor: {
      type: String,
      trim: true,
      default: null // Format: '#FF6B6B'
    },
    textColor: {
      type: String,
      trim: true,
      default: null // Format: '#FFFFFF'
    },
    textAlign: {
      type: String,
      enum: ['left', 'center', 'right', null],
      default: 'center'
    },
    fontSize: {
      type: Number,
      min: 12,
      max: 72,
      default: null // Ex: 28
    },
    fontWeight: {
      type: String,
      enum: ['w400', 'w500', 'w600', 'w700', 'w800', 'w900', null],
      default: null // Ex: 'w600'
    },
    // ✅ Nouveau champ pour légende des images/vidéos
    caption: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null
    }
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

// Validation personnalisée pour s'assurer de la cohérence des données
storySchema.pre('save', function(next) {
  const contenu = this.contenu;

  // Pour les stories texte, au moins le texte doit être présent
  if (contenu.type === 'texte' && !contenu.texte) {
    return next(new Error('Le texte est requis pour une story de type texte'));
  }

  // Pour les stories image, l'URL de l'image doit être présente
  if (contenu.type === 'image' && !contenu.image) {
    return next(new Error('L\'image est requise pour une story de type image'));
  }

  // Pour les stories vidéo, l'URL de la vidéo doit être présente
  if (contenu.type === 'video' && !contenu.video) {
    return next(new Error('La vidéo est requise pour une story de type vidéo'));
  }

  // Nettoyer les champs de style inutiles pour les stories non-texte
  if (contenu.type !== 'texte') {
    contenu.backgroundColor = null;
    contenu.textColor = null;
    contenu.textAlign = null;
    contenu.fontSize = null;
    contenu.fontWeight = null;
  }

  // Nettoyer la légende pour les stories texte (pas de légende sur du texte pur)
  if (contenu.type === 'texte') {
    contenu.caption = null;
  }

  next();
});

// Middleware pour supprimer les fichiers associés avant de supprimer le document
storySchema.pre('deleteOne', async function(next) {
  console.log('🔥 PRE-DELETE Story START');

  try {
    const Model = this.model;
    const story = await Model.findOne(this.getFilter());

    // ⚠️ VÉRIFICATION CRITIQUE
    if (!story) {
      console.warn('⚠️  Story non trouvée dans pre-delete');
      return next();
    }

    console.log('Story à supprimer:', {
      id: story._id,
      type: story.contenu?.type,
      utilisateur: story.utilisateur
    });

    // ⚠️ SUPPRESSION FIREBASE (pas local!)
    if (story.contenu && ['image', 'video'].includes(story.contenu.type)) {
      const fileType = story.contenu.type;
      const fileUrl = story.contenu[fileType];

      console.log('📎 Fichier story détecté:', fileType);
      console.log('   URL:', fileUrl);

      // ⚠️ VÉRIFICATION: L'URL existe-t-elle ?
      if (!fileUrl) {
        console.warn('⚠️  URL de fichier manquante');
        return next();
      }

      try {
        // ✅ Extraire le chemin Firebase depuis l'URL
        const bucketName = bucket.name;
        const urlPattern = `https://storage.googleapis.com/${bucketName}/`;

        if (fileUrl.startsWith(urlPattern)) {
          const filePath = fileUrl.replace(urlPattern, '');
          const decodedPath = decodeURIComponent(filePath);

          console.log('   Chemin Firebase:', decodedPath);
          console.log('   → Suppression du fichier Firebase...');

          await bucket.file(decodedPath).delete();
          console.log('   ✓ Fichier Firebase supprimé avec succès');
        } else {
          console.warn('⚠️  URL ne correspond pas au bucket:', fileUrl);
        }
      } catch (fileError) {
        console.error('❌ Erreur suppression fichier Firebase:', fileError.message);
        console.error('   Code:', fileError.code);

        // ⚠️ Ne pas bloquer la suppression de la story
        if (fileError.code === 404) {
          console.log('   ℹ️  Fichier déjà supprimé ou inexistant');
        }
      }
    }

    console.log('🔥 PRE-DELETE Story END');
    next();
  } catch (error) {
    console.error('❌ Erreur pre-delete Story:', error);
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

    if (this.active) {
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

// ✅ Méthode helper pour vérifier si c'est une story texte stylisée
storySchema.methods.isStyledText = function() {
  return this.contenu.type === 'texte' &&
         (this.contenu.backgroundColor || this.contenu.textColor);
};

// ✅ Méthode helper pour vérifier si la story a une légende
storySchema.methods.hasCaption = function() {
  return this.contenu.caption && this.contenu.caption.trim().length > 0;
};

module.exports = mongoose.model('Story', storySchema);
