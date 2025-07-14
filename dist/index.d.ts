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
declare const _default: Config;

export { _default as default };
