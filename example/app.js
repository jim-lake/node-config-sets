console.log('app: here');

const config = require('../dist/index');
console.log('app: Current config set:', config.currentConfigSet());
config.globalLoad({ configSet: 'prod' });
console.log('app: after load Current config set:', config.currentConfigSet());
const submodule = require('./subdir/submodule.js');

console.log('app: config:', config);

console.log('app: config.file_prod_json:', config.file_prod_json);

console.log('app: JSON.stringify(config):', JSON.stringify(config));
