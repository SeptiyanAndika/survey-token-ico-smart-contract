require('babel-register')({
  ignore: /node_modules\/(?!zeppelin-solidity)/
});
require('babel-polyfill');


const HDWalletProvider = require('truffle-hdwallet-provider');
const PrivateKeyProvider = require("truffle-privatekey-provider");

/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

const privateKey = process.env.PRIVATE_KEY || process.env.PRIVATEKEY || null;
const mnemonic = process.env.MNEMONIC  || '';
let kovanProvider =  new HDWalletProvider(mnemonic, 'https://kovan.infura.io');
if(privateKey!=null){
  kovanProvider = new PrivateKeyProvider(privateKey, 'https://kovan.infura.io');
}


module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 7545,
      network_id: '*', // Match any network id
      gas: 6000000,
    },
    kovan: {
      provider: kovanProvider,
      network_id: 42,
      gas: 6000000,
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
};
