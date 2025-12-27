const crypto = require('crypto');

// Same encryption settings as server.js
const ENCRYPTION_KEY = crypto.scryptSync('eduspace_secret', 'salt', 32);
const IV_LENGTH = 16;

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) { return text; }
}

// Test decrypting formateur-demo-1
const encryptedEmail = "730e8500e5eb59edfcf3ae4f163c9896:f04b4d6bdc83d81efdaef1cd8efbbd655a87f822d2b11b2a905fdc0db90fd46a";
const encryptedPassword = "81e30a02139995c51eb10a1d5b059610:8a30b041ad2074772bf97bcf5e451aa4";

console.log("Formateur Demo 1 Credentials:");
console.log("Email:", decrypt(encryptedEmail));
console.log("Password:", decrypt(encryptedPassword));
