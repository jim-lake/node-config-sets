console.log('app: here');

import config from '../dist/index';
console.log('app: Current config set:', config);
config.globalLoad({ configSet: 'prod' });

import submodule from './subdir/submodule.js';

console.log('app: config:', config);

console.log('app: config.file_prod_json:', config.file_prod_json);

console.log('app: submodule:', submodule);

console.log('app: JSON.stringify(config):', JSON.stringify(config));
