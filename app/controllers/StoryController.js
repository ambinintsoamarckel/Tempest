const storyService = require('../services/StoryService');
const { getIo } = require('../../config/socketConfig');
const io = getIo();

module.exports = {
  /**
   * ✅ Créer une story (texte stylisé OU fichier avec légende)
   * Body pour texte:
   * {
   *   type: 'texte',
   *   texte: 'Mon message',
   *   backgroundColor: '#FF6B6B',
   *   textColor: '#FFFFFF',
   *   textAlign: 'center',
   *   fontSize: 28,
   *   fontWeight: 'w600'
   * }
   *
   * FormData pour fichier:
   * - file: [fichier binaire]
   * - caption: 'Ma légende' (optionnel)
   */
  async creerStory(req, res) {
    try {
      console.log('📥 Création story - Body:', req.body);
      console.log('📥 Création story - File:', req.file ? 'Présent' : 'Absent');

      // Déterminer si c'est une story texte ou fichier
      const isFileStory = req.file !== undefined;

      let storyData;

      if (isFileStory) {
        // Story avec fichier (image/vidéo)
        const fileUrl = req.file.firebaseUrl; // Suppose que tu utilises Firebase
        const mimeType = req.file.mimetype;
        const isVideo = mimeType.startsWith('video/');

        storyData = {
          utilisateur: req.user._id, // De l'auth middleware
          contenu: {
            type: isVideo ? 'video' : 'image',
            [isVideo ? 'video' : 'image']: fileUrl,
            caption: req.body.caption || null // ✅ Légende optionnelle
          }
        };

        console.log('📷 Story fichier avec', isVideo ? 'vidéo' : 'image');
        if (req.body.caption) {
          console.log('💬 Légende:', req.body.caption);
        }
      } else {
        // Story texte stylisée
        storyData = {
          utilisateur: req.user._id,
          contenu: {
            type: 'texte',
            texte: req.body.texte,
            // ✅ Styles optionnels
            backgroundColor: req.body.backgroundColor || null,
            textColor: req.body.textColor || null,
            textAlign: req.body.textAlign || 'center',
            fontSize: req.body.fontSize ? parseFloat(req.body.fontSize) : null,
            fontWeight: req.body.fontWeight || null
          }
        };

        console.log('📝 Story texte stylisée');
        console.log('   Couleur fond:', storyData.contenu.backgroundColor);
        console.log('   Couleur texte:', storyData.contenu.textColor);
      }

      const story = await storyService.createStory(storyData);

      // Émettre l'événement socket
      io.emit('story_cree', story);

      console.log('✅ Story créée:', story._id);
      res.status(201).json(story);
    } catch (error) {
      console.error('❌ Erreur création story:', error);
      res.status(400).json({ message: error.message });
    }
  },

  async recupererStory(req, res) {
    try {
      const story = await storyService.findStoryById(req.params.id);

      io.emit('story_recuperee', story);

      res.status(200).json(story);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async getAllStory(req, res) {
    try {
      const stories = await storyService.getActiveStoriesGroupedByUser();

      console.log(`📊 ${stories.length} groupes de stories récupérés`);

      res.status(200).json(stories);
    } catch (error) {
      console.error('❌ Erreur récupération stories:', error);
      res.status(404).json({ message: error.message });
    }
  },

  async getStoryById(req, res) {
    try {
      const story = await storyService.getActiveStoriesByUser(req.params.userid);

      if (!story) {
        return res.status(404).json({ message: 'Aucune story active pour cet utilisateur' });
      }

      io.emit('story_recuperee', story);

      res.status(200).json(story);
    } catch (error) {
      console.error('❌ Erreur récupération story utilisateur:', error);
      res.status(404).json({ message: error.message });
    }
  },

  async getArchivesById(req, res) {
    try {
      const story = await storyService.getArchivesById(req.params.id);

      if (!story) {
        return res.status(404).json({ message: 'Archive non trouvée' });
      }

      res.status(200).json(story);
    } catch (error) {
      console.error('❌ Erreur récupération archive:', error);
      res.status(404).json({ message: error.message });
    }
  },

  async supprimerStory(req, res) {
    try {
      await storyService.deleteStory(req.params.id);

      io.emit('story_supprimee', req.params.id);

      console.log('✅ Story supprimée:', req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('❌ Erreur suppression story:', error);
      res.status(400).json({ message: error.message });
    }
  }
};
