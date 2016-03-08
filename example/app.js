'use strict';

console.log("here");

const config = require('node-config-sets');
console.log("Current config set:",config.currentConfigSet());
config.globalLoad({ configSet: 'prod' });
const submodule = require('./subdir/submodule.js');

console.log("config:",config);

console.log("JSON.stringify(config):",JSON.stringify(config));
