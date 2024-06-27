// socketConfig.js
let io;

const initializeSocket = (server) => {
  const socketIo = require('socket.io');
  io = socketIo(server);
  io.on('connection', (socket) => {
    console.log('Nouvel utilisateur connecté');

    // Écouter l'événement de connexion
    socket.on('user_connected', (userId) => {
      console.log(`Utilisateur connecté : ${userId}`);
      // Traitez l'événement de connexion de l'utilisateur ici
    });

    // Écouter l'événement de déconnexion
    socket.on('user_disconnected', (userId) => {
      console.log(`Utilisateur déconnecté : ${userId}`);
      // Traitez l'événement de déconnexion de l'utilisateur ici
    });

    socket.on('disconnect', () => {
      console.log('Utilisateur déconnecté');
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io n\'a pas été initialisé !');
  }
  return io;
};

module.exports = { initializeSocket, getIo };
