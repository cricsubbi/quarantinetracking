var xxtea = require('xxtea-node');

var str = "Sadashivgad, Karwar, Karnataka 581352 V44M+25 Sadashivgad, Majali, Karnataka";
var key = "1234567890";
var encrypt_data = xxtea.encryptToString(str, key);
console.log(encrypt_data);
var decrypt_data = xxtea.decryptToString(encrypt_data, key);
console.log(decrypt_data);