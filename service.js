var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'MuteBotV3',
  description: 'BingBongs install of MuteBot(Davis)',
  script: 'E:\\Projects\\mutebot\\index.js',
  nodeOptions: [

  ]
  ///, workingDirectory: '...'
  //, allowServiceLogon: true
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();