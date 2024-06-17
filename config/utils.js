const path = require('path');

const formatPhotoPath = (photoPath) => {
  if (!photoPath) {
    return null;
  }
  const formattedPath = path.basename(photoPath); // Juste le nom du fichier
  return formattedPath;
};

module.exports = {
  formatPhotoPath
};
