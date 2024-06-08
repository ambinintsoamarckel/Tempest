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

  // Ajouter une vue à une story
  async addView(storyId, utilisateurId) {
    try {
      const story = await Story.findById(storyId);
      if (!story) {
        throw new Error('Story non trouvée');
      }
      if (!story.vues.includes(utilisateurId)) {
        story.vues.push(utilisateurId);
        await story.save();
      }
      return story;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la vue à la story :', error);
      throw error;
    }
  }
}

module.exports = new StoryService();
