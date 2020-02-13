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
