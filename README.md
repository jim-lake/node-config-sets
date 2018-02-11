# node-config-sets
A node configuration set module

### aws kms support

You can encrypt your config if you provide a `kms_key_id` in your json and use `config-set create` to create your config file.

```json
{"kms_key_id":"11111-22222....",
 "username": "bob",
 "password": "foobar"
}
```

[![asciicast](https://asciinema.org/a/HstLnr4VKU3174A2j4IqMK9fO.png)](https://asciinema.org/a/HstLnr4VKU3174A2j4IqMK9fO)
