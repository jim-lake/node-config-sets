console.log('sub: here');

const config = require('../../dist/index');

console.log('sub: Current config set:', config.currentConfigSet());

console.log('sub: onfig:', config);

console.log('sub: JSON.stringify(config):', JSON.stringify(config));

exports.foo = 1;
