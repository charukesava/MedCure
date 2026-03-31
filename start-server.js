// Root-level server starter for Render deployment
// This file allows Render to start the backend from the project root
process.chdir(__dirname + '/backend');
require('./backend/server.js');
