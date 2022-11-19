const path = require('path');

module.exports = path.dirname(process.mainModule.filename);

//Accessing the folder from the root directory of the project via path.join(__dirname, '<relative-folder-path>) worked for me