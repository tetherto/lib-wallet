'use strict'; 

const test = require('brittle')
const Wallet = require('../src/wallet-lib.js')
const { BitcoinPay } = require('lib-wallet-pay-btc')
const { regtestNode } = require('lib-wallet-pay-btc/test/test-helpers.js')
const { WalletStoreHyperbee } = require('lib-wallet-store')

test('Load wallet with bitcoin', function (t) {

  console.log(WalletStoreHyperbee)

})
