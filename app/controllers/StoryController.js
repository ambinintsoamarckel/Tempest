const storyService = require('../services/StoryService');

module.exports = {
  async creerStory(req, res) {
    try {
      const story = await storyService.createStory(req.body);
      res.status(201).json(story);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererStory(req, res) {
    try {
      const story = await storyService.findStoryById(req.params.id);
      res.status(200).json(story);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async supprimerStory(req, res) {
    try {
      await storyService.deleteStory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};
