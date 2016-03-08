'use strict';

const path = require('path');
const deepExtend = require('deep-extend');
const _ = require('lodash');

const privateDataMap = new WeakMap();

const ENV_PREFIX = 'NODE_CONFIG_SET_';

class Config {
  constructor(args) {
    this._configLoad(args);
  }
  _configLoad(args) {
    let configSet = false;
    if (args) {
      configSet = args.configSet;
    }
    if (!configSet) {
      configSet = process.env.NODE_CONFIG_SET || process.env.NODE_ENV || "dev";
    }

    let rootdir = false;
    if (args) {
      rootdir = args.rootdir;
    }
    if (!rootdir) {
      let topModule = module;
      while(topModule.parent) {
        topModule = topModule.parent;
      }
      const match = topModule.paths[0].match(/(.*)\/node_modules/);
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
    privateDataMap.set(this,privateData);

    const config_default = tryRequire('config/default.json',rootdir);
    const config_current_set = tryRequire('config/' + configSet + '.json',rootdir);
    const config_json = tryRequire('config.json',rootdir);

    const config_env = _.pick(process.env,(v,k) => {
      return k.indexOf(ENV_PREFIX) === 0;
    });
    const config_env_json = _.mapKeys(config_env,(v,k) => {
      return k.slice(ENV_PREFIX.length).toLowerCase();
    });

    _.each(this,(v,k) => {
      delete this[k];
    });
    deepExtend(this,config_default,config_current_set,config_json,config_env_json);
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

function tryRequire(file,rootdir) {
  try {
    const path_file = path.join(rootdir,file);
    return require(path_file);
  } catch(e) {
    return {};
  }
}

let globalConfig = new Config();
module.exports = globalConfig;
