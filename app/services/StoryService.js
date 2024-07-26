const Story = require('../models/Story');
const Utilisateur = require('../models/Utilisateur');

class StoryService {
  // Créer une nouvelle story
  async createStory(data) {
    try {
      const story = new Story(data);
      await story.save();
      return story;
    } catch (error) {
      console.error('Erreur lors de la création de la story :', error);
      throw error;
    }
  }

  // Récupérer toutes les stories d'un utilisateur
  async getStoriesByUtilisateur(utilisateurId) {
    try {
      return await Story.find({ utilisateur: utilisateurId });
    } catch (error) {
      console.error('Erreur lors de la récupération des stories de l\'utilisateur :', error);
      throw error;
    }
  }

  async getActiveStoriesGroupedByUser  () {
    try {
      const stories = await Story.find({ active: true })
        .populate('utilisateur', '_id nom email photo') // Populate utilisateur avec les champs nécessaires
        .sort({ dateCreation: -1 }) // Trie par date de création (du plus récent au moins récent)
        .exec();
  
      // Grouper les stories par utilisateur
      const groupedStories = stories.reduce((acc, story) => {
        const userId = story.utilisateur._id.toString();
        if (!acc[userId]) {
          acc[userId] = {
            utilisateur: {
              _id: story.utilisateur._id,
              nom: story.utilisateur.nom,
              email: story.utilisateur.email,
              photo: story.utilisateur.photo,
            },
            stories: []
          };
        }
        acc[userId].stories.push({
          _id: story._id,
          contenu: story.contenu,
          dateCreation: story.dateCreation,
          dateExpiration: story.dateExpiration,
          vues: story.vues
        });
        return acc;
      }, {});
  
      // Convertir l'objet en tableau
      const result = Object.values(groupedStories);
      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération des stories groupées par utilisateur :', error);
      throw error;
    }
  };
  async  getActiveStoriesByUser(userId) {
    try {
      const stories = await Story.find({ active: true, utilisateur: userId })
        .populate('utilisateur', '_id nom email photo') // Populate utilisateur avec les champs nécessaires
        .sort({ dateCreation: -1 }) // Trie par date de création (du plus récent au moins récent)
        .exec();
  
      if (stories.length === 0) {
        return null;
      }
  
      const utilisateur = {
        _id: stories[0].utilisateur._id,
        nom: stories[0].utilisateur.nom,
        email: stories[0].utilisateur.email,
        photo: stories[0].utilisateur.photo,
      };
  
      const userStories = stories.map(story => ({
        _id: story._id,
        contenu: story.contenu,
        dateCreation: story.dateCreation,
        dateExpiration: story.dateExpiration,
        vues: story.vues,
      }));
  
      return {
        utilisateur,
        stories: userStories,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stories pour un utilisateur :', error);
      throw error;
    }
  }

  async  getArchivesById(id) {
    try {
      const stories = await Story.findById(id).populate('utilisateur vues');
  

  
      return stories;
    } catch (error) {
      console.error('Erreur lors de la récupération des stories pour un utilisateur :', error);
      throw error;
    }
  }
  
  
}

module.exports = new StoryService();
