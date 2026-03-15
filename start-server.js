// Launcher script — ensures server.js runs with correct cwd for dotenv
const path = require('path');
process.chdir(path.join(__dirname, 'server'));
require('./server/server.js');
