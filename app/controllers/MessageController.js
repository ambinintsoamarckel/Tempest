const messageService = require('../services/MessageService');

/*socket*/
const { getIo } = require('../../config/socketConfig');

const io = getIo();

module.exports = {
  async creerMessage(req, res) {
    try {
      const message = await messageService.createMessage(req.body);
      
      io.emit('message_cree', message);
      
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererMessage(req, res) {
    try {
      const message = await messageService.findMessageById(req.params.id);
      
      io.emit('message_recupere', message);
      
      res.status(200).json(message);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async modifierMessage(req, res) {
    try {
      const message = await messageService.updateMessage(req.params.id, req.body);
      
      io.emit('message_modifie', message);
      
      res.status(200).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerMessage(req, res) {
    try {
      await messageService.deleteMessage(req.params.id);
      
      io.emit('message_supprime', req.params.id);
      
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};
