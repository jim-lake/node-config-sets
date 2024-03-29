'use strict';

const path = require('path');
const deepExtend = require('deep-extend');

const privateDataMap = new WeakMap();

const ENV_PREFIX = 'NODE_CONFIG_SET_';

class Config {
  constructor(args) {
    this._configLoad(args || {});
  }
  _configLoad(args) {
    let configSet = args.configSet;
    if (!configSet) {
      configSet = process.env.NODE_CONFIG_SET || process.env.NODE_ENV || 'dev';
    }

    let rootdir = args.rootdir;
    if (!rootdir) {
      let topModule = module;
      while (topModule.parent) {
        topModule = topModule.parent;
      }
      const match =
        topModule.paths && topModule.paths[0].match(/(.*)\/node_modules/);
      if (match && match.length > 1) {
        rootdir = match[1];
      }
    }
    if (!rootdir) {
      rootdir = __dirname;
    }

    const privateData = {
      configSet,
      rootdir,
    };
    privateDataMap.set(this, privateData);

    const config_default_default = args.configDefault || {};
    const config_default = tryRequire('config/default.json', rootdir);
    const config_current_set = tryRequire(
      'config/' + configSet + '.json',
      rootdir
    );
    const config_json = tryRequire('config.json', rootdir);

    const config_env_json = {};
    Object.keys(process.env).forEach((key) => {
      if (key.indexOf(ENV_PREFIX) === 0) {
        const unprefixed_key = key.slice(ENV_PREFIX.length).toLowerCase();
        config_env_json[unprefixed_key] = process.env[key];
      }
    });

    for (let k in this) {
      delete this[k];
    }
    deepExtend(
      this,
      config_default_default,
      config_default,
      config_current_set,
      config_json,
      config_env_json
    );
    return this;
  }
  currentConfigSet() {
    const privateData = privateDataMap.get(this);
    return privateData.configSet;
  }
  load(args) {
    return new Config(args);
  }
  globalLoad(args) {
    return globalConfig._configLoad(args);
  }
}

function tryRequire(file, rootdir) {
  try {
    const path_file = path.join(rootdir, file);
    return require(path_file);
  } catch (e) {
    return {};
  }
}

let globalConfig = new Config();
module.exports = globalConfig;
