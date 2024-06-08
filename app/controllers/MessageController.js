const messageService = require('../services/MessageService');

module.exports = {
  async creerMessage(req, res) {
    try {
      const message = await messageService.createMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererMessage(req, res) {
    try {
      const message = await messageService.findMessageById(req.params.id);
      res.status(200).json(message);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async modifierMessage(req, res) {
    try {
      const message = await messageService.updateMessage(req.params.id, req.body);
      res.status(200).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerMessage(req, res) {
    try {
      await messageService.deleteMessage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};
