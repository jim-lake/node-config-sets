'use strict';

const crypto = require('crypto');
const fs = require('fs');
const AWS = require('aws-sdk');
const _ = require('lodash');
const path = require('path');

const g_crypto_algo = 'aes-256-cbc';
const g_aes_key_length = 32;

exports.decrypt_config = decrypt_config;
exports.decrypt_aes_key = decrypt_aes_key;
exports.encrypt_file = encrypt_file;
exports.decrypt_file = decrypt_file;
exports.tryRequire = tryRequire;


function tryRequire(file,rootdir) {
  try {
    const path_file = path.join(rootdir,file);
    return require(path_file);
  } catch(e) {
    return {};
  }
}

function encrypt(text,password){
  const iv = new Buffer(16);
  iv.fill(0);
  const cipher = crypto.createCipheriv(g_crypto_algo,password,iv);
  let encrypted = cipher.update(text,'utf8','hex')
  encrypted += cipher.final('hex');
  return encrypted;
}

function encrypt_config(config,key) {
  const text = JSON.stringify(config);
  const encrypted_data = encrypt(text,key);
  return {encrypted_data};
}

function decrypt(encrypted,key){
  const iv = new Buffer(16);
  iv.fill(0);
  const decipher = crypto.createDecipheriv(g_crypto_algo,key,iv);
  let decrypted = decipher.update(encrypted,'hex','utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function decrypt_config(data,key) {
  const decrypted_data = decrypt(data,key);
  let config = JSON.parse(decrypted_data);
  return config;
}

function decrypt_aes_key(encrypted_aes_key,kms_key_region,done) {
  let key = false;
  const params = {
    CiphertextBlob: Buffer(encrypted_aes_key, 'base64'),
  };

  AWS.config.update({region: kms_key_region});
  const kms = new AWS.KMS();

  kms.decrypt(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      key = data.Plaintext
    }
    done(err,key);
  });
}

function encrypt_aes_key(kms_key_id,kms_key_region,aes_key,done) {
  const params = {
    KeyId: kms_key_id, 
    Plaintext: aes_key,
  };

  AWS.config.update({region: kms_key_region});
  const kms = new AWS.KMS();

  kms.encrypt(params, function(err, data) {
    let encrypted_aes_key = false
    if (err) {
      console.log(err, err.stack);
    } else {
      encrypted_aes_key = data.CiphertextBlob.toString('base64');
    }
    done(err,encrypted_aes_key);
  });
}

function encrypt_file(src,dst,done) {
  const config = tryRequire(src,process.cwd());
  const aes_key = crypto.randomBytes(g_aes_key_length);
  const {kms_key_id,kms_key_region} = config;
  if (!kms_key_id) {
    done('kms_key_id missing')
  } else {
    encrypt_aes_key(kms_key_id,kms_key_region,aes_key,(err,encrypted_aes_key) => {
      const kms_config = {
        encrypted_aes_key,
        kms_key_region,
      };
      const encrypted_config = encrypt_config(config,aes_key);
      const output = _.extend({},kms_config, encrypted_config);
      fs.writeFile(dst,JSON.stringify(output, null,4),(err)=>{
        done(err,dst);
      });
    });
  }
}

function decrypt_file(filepath,done) {
  const encrypted_config = tryRequire(filepath,process.cwd());
  let config = false;
  const {
    encrypted_aes_key,
    kms_key_region
  } = encrypted_config;

  if (encrypted_aes_key && kms_key_region) {
    decrypt_aes_key(encrypted_aes_key,kms_key_region, function(err, key) {
      if (err) {
        console.error('decrypt_aes_key error:',err);
      } else {
        config = decrypt_config(encrypted_config.encrypted_data,key);
      }
      done(err,config);
    });    
  } else {
    done('config not found | encrypted_aes_key not found')
  }
}
