const Service = require('node-windows').Service;
const path = require('path');
const nodemon = require('nodemon');

// Path to your Node.js application's main script
const scriptPath = path.join('C:\\wamp64\\www\\Xpert\\analyses\\', 'server.js');


// Configure nodemon
const nodemonConfig = {
  script: scriptPath,
  watch: [scriptPath], // Watch for changes in your script file
  ext: 'js json', // File extensions to watch
  delay: 1000, // Delay in milliseconds to wait before restarting
  legacyWatch: true // Use legacy file watching for Windows
};

// Start nodemon
nodemon(nodemonConfig);

// Create a new service object
const svc = new Service({
  name: 'Analyses APP',
  description: 'Pharmacie ELOMARI Analyses APP',
  script: scriptPath
});

// Install the service
svc.install();

// Handle events
svc.on('install', () => {
  svc.start();
});

svc.on('uninstall', () => {
  console.log('Service uninstalled');
});

svc.on('start', () => {
  console.log('Service started');
});

svc.on('stop', () => {
  console.log('Service stopped');
});

svc.on('error', (error) => {
  console.error('Error:', error);
});
