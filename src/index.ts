import path from 'node:path';

const privateDataMap = new WeakMap();

const ENV_PREFIX = 'NODE_CONFIG_SET_';

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
  [key: string]: JSONValue;
}
type JSONArray = JSONValue[];

type Params = {
  configSet?: string;
  rootdir?: string;
  configDefault?: JSONObject;
};

interface ConfigControl {
  currentConfigSet(): string | undefined;
  load(params: Params): Config;
  globalLoad(params: Params): Config;
}

type Config = JSONObject & ConfigControl;

class ConfigImpl {
  constructor(params?: Params) {
    this._configLoad(params ?? {});
  }
  private _configLoad(params: Params) {
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

    const config_default_default = params.configDefault || {};
    const config_default = _tryRequire('config/default.json', rootdir);
    const config_current_set = _tryRequire(
      'config/' + configSet + '.json',
      rootdir
    );
    const config_json = _tryRequire('config.json', rootdir);

    const config_env_json: any = {};
    Object.keys(process.env).forEach((key) => {
      if (key.indexOf(ENV_PREFIX) === 0) {
        const unprefixed_key = key.slice(ENV_PREFIX.length).toLowerCase();
        config_env_json[unprefixed_key] = process.env[key];
      }
    });

    for (let k in this) {
      delete this[k];
    }
    _deepExtend(
      this as any,
      config_default_default,
      config_default,
      config_current_set,
      config_json,
      config_env_json
    );
    return this;
  }
  public currentConfigSet() {
    const privateData = privateDataMap.get(this);
    return privateData?.configSet;
  }
  public load(params: Params) {
    return new ConfigImpl(params);
  }
  public globalLoad(params: Params) {
    return globalConfig._configLoad(params);
  }
}
function _tryRequire(file: string, rootdir: string) {
  try {
    const path_file = path.join(rootdir, file);
    return require(path_file);
  } catch (e) {
    return {};
  }
}
function _deepExtend(target: any, ...sources: any[]): any {
  for (const source of sources) {
    for (const key in source) {
      const sourceVal = source[key];
      const targetVal = target[key];

      if (_isPlainObject(sourceVal) && _isPlainObject(targetVal)) {
        target[key] = _deepExtend(targetVal, sourceVal);
      } else if (Array.isArray(sourceVal) && Array.isArray(targetVal)) {
        target[key] = [...targetVal, ...sourceVal];
      } else {
        target[key] = sourceVal;
      }
    }
  }
  return target;
}

function _isPlainObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

let globalConfig = new ConfigImpl();
export default globalConfig as unknown as Config;
