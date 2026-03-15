// Launcher script — runs next dev from the client directory
const path = require('path');
process.chdir(path.join(__dirname, 'client'));
process.argv = ['node', 'next', 'dev', '--webpack'];
require('./client/node_modules/next/dist/bin/next');
