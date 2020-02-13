# node-config-sets
A node configuration set module

## AWS KMS Support

You can encrypt your config if you provide a `kms_key_id` and `kms_region` in your json config file.

```json
{
    "kms_key_id":"11111-22222....",
    "kms_region": "us-west-2",
    "username": "bob",
    "password": "foobar",
    "db": {
        "host": "db.example.com",
        "user": "app_user",
        "password": "password"
    }
}
```

#### encrypt
    usage:
    npx config-set encrypt config/config.dev.json

This will create an encrypted version of `config.dev.json` called `config.dev.encrypted.json`

#### show
    usage:
    npx config-set show config/config.dev.encrypted.json

Prints the contents of `config.dev.encrypted.json` to stdout. 

#### code initialization 

Use `config.wait({configSet: 'configName'}, (err) => {})` to decrypt the configuration at runtime.

```javascript

const express = require('express');
const config = require('node-config-sets');

...

const configSet = process.env.NODE_ENV || 'dev';

config.wait({ configSet: configSet }, (err) => {
  if(err) {
    console.error('load config failed');
    process.exit(-1);
  } else {
    console.log('load config ok');
    const app = express();

    ...

    app.listen(port, () => console.log(`http listening on port ${config.port}`));
  }
});

```