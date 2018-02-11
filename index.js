'use strict';

const path = require('path');
const deepExtend = require('deep-extend');
const _ = require('lodash');
const utils = require('./utils');

const privateDataMap = new WeakMap();
let g_queue = false;
let g_is_ready = false;

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

    const rootdir = this.getRootDir(args);

    const privateData = {
      configSet,
      rootdir,
    };
    privateDataMap.set(this,privateData);

    const config_default = utils.tryRequire('config/default.json',rootdir);
    const config_current_set = utils.tryRequire('config/' + configSet + '.json',rootdir);
    const config_json = utils.tryRequire('config.json',rootdir);

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
  getRootDir(args) {
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
    return rootdir;
  }
  wait(args,done) {
    const _this = this;

    if (g_is_ready) {
      setImmediate(done);
    } else if(g_queue) {
      g_queue.push(done);
    } else {
      g_queue = [done];
      let config = false;
      let configSet = false;
      const rootdir = this.getRootDir(args);

      if (args) {
        configSet = args.configSet;
      }
      if (!configSet) {
        configSet = process.env.NODE_CONFIG_SET || process.env.NODE_ENV || "dev";
      }
      
      const config_encrypted = utils.tryRequire('config/config.' + configSet + '.encrypted.json',rootdir);
      const {encrypted_aes_key,kms_key_region} = config_encrypted;

      if (encrypted_aes_key) {
        utils.decrypt_aes_key(encrypted_aes_key,kms_key_region,function(err, key) {
          if (!err) {
            config = utils.decrypt_config(config_encrypted.encrypted_data,key,config_encrypted.iv);
            _.each(_this,(v,k) => {
              delete _this[k];
            });
            deepExtend(_this,config);
          }
          decrypt_done(err);
        });
      } else {
        decrypt_done('encrypted_aes_key not found');
      }
    }
  }
}

function decrypt_done(err) {
  g_is_ready=true;
  g_queue.forEach((done) => setImmediate(done));
  g_queue=[];
}

let globalConfig = new Config();
module.exports = globalConfig;
