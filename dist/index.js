'use strict';

var path = require('node:path');

const privateDataMap = new WeakMap();
const ENV_PREFIX = 'NODE_CONFIG_SET_';
class ConfigImpl {
    constructor(params) {
        this._configLoad(params ?? {});
    }
    _configLoad(params) {
        let configSet = params.configSet;
        if (!configSet) {
            configSet = process.env.NODE_CONFIG_SET || process.env.NODE_ENV || 'dev';
        }
        let rootdir = params.rootdir;
        if (!rootdir) {
            let topModule = module;
            while (topModule.parent) {
                topModule = topModule.parent;
            }
            const match = topModule.paths && topModule.paths[0].match(/(.*)\/node_modules/);
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
        const config_default_default = params.configDefault || {};
        const config_default = _tryRequire('config/default.json', rootdir);
        const config_current_set = _tryRequire('config/' + configSet + '.json', rootdir);
        const config_json = _tryRequire('config.json', rootdir);
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
        _deepExtend(this, config_default_default, config_default, config_current_set, config_json, config_env_json);
        return this;
    }
    currentConfigSet() {
        const privateData = privateDataMap.get(this);
        return privateData?.configSet;
    }
    load(params) {
        return new ConfigImpl(params);
    }
    globalLoad(params) {
        return globalConfig._configLoad(params);
    }
}
function _tryRequire(file, rootdir) {
    try {
        const path_file = path.join(rootdir, file);
        return require(path_file);
    }
    catch (e) {
        return {};
    }
}
function _deepExtend(target, ...sources) {
    for (const source of sources) {
        for (const key in source) {
            const sourceVal = source[key];
            const targetVal = target[key];
            if (_isPlainObject(sourceVal) && _isPlainObject(targetVal)) {
                target[key] = _deepExtend(targetVal, sourceVal);
            }
            else if (Array.isArray(sourceVal) && Array.isArray(targetVal)) {
                target[key] = [...targetVal, ...sourceVal];
            }
            else {
                target[key] = sourceVal;
            }
        }
    }
    return target;
}
function _isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
let globalConfig = new ConfigImpl();

module.exports = globalConfig;
