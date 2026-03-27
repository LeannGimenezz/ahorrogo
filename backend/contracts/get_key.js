/**
 * Script para derivar private key desde seed phrase
 * 
 * USO:
 * node get_key.js "your 12 word seed phrase"
 * 
 * ADVERTENCIA: Borra este archivo después de usar
 */

const bip39 = require('bip39');
const hdkey = require('hdkey');

const seedPhrase = process.argv[2];

if (!seedPhrase) {
  console.error('❌ Uso: node get_key.js "tu seed phrase de 12 palabras"');
  process.exit(1);
}

console.log('\n🔐 Derivando private key...\n');

// Validar seed phrase
if (!bip39.validateMnemonic(seedPhrase)) {
  console.error('❌ Seed phrase inválida');
  process.exit(1);
}

// Generar seed desde mnemonic
const seed = bip39.mnemonicToSeedSync(seedPhrase);

// Derivar usando derivation path m/44'/60'/0'/0/0 (Ethereum/RSK)
const hdwallet = hdkey.fromMasterSeed(seed);
const privateKey = hdwallet.derive("m/44'/60'/0'/0/0").privateKey;

// Convertir a hex
const privateKeyHex = '0x' + privateKey.toString('hex');

// derivar address pública
const ethereumjs = require('ethereumjs-util');
const address = ethereumjs.bufferToHex(ethereumjs.pubToAddress(
  ethereumjs.bufferToHex(
    hdwallet.derive("m/44'/60'/0'/0/0").publicKey
  ),
  true
));

console.log('📋 RESULTADOS:\n');
console.log('Address (pública):', address.toLowerCase());
console.log('');
console.log('Private Key (SECRETA - no compartir):');
console.log(privateKeyHex);
console.log('\n⚠️  COPIÁ LA PRIVATE KEY ARRIBA');
console.log('⚠️  Luego BORRÁ este archivo por seguridad\n');
