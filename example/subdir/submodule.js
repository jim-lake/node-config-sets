'use strict';

console.log('here2');

const config = require('node-config-sets');

console.log('Current config set:', config.currentConfigSet());

console.log('config:', config);

console.log('JSON.stringify(config):', JSON.stringify(config));
