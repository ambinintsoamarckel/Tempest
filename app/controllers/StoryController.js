const storyService = require('../services/StoryService');

/*socket*/
const { getIo } = require('../../config/socketConfig');

const io = getIo();


module.exports = {
  async creerStory(req, res) {
    try {
      const story = await storyService.createStory(req.body);
      
      io.emit('story_cree', story); 
      
      res.status(201).json(story);
    } catch (error) {
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
      const story = await storyService.getActiveStoriesGroupedByUser();
      
      io.emit('story_recuperee', story); 
      
      res.status(200).json(story);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },
  async getStoryById(req,res)
  {
    try {
      const story = await storyService.getActiveStoriesByUser(req.params.userid);
      
      io.emit('story_recuperee', story); 
      
      res.status(200).json(story);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async supprimerStory(req, res) {
    try {
      await storyService.deleteStory(req.params.id);
      
      io.emit('story_supprimee', req.params.id);
      
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};
