'use strict'
// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
const Wallet = require('./lib/wallet.js')

const { WalletStoreHyperbee } = require('lib-wallet-store')
const BIP39Seed = require('wallet-seed-bip39')
const { BitcoinPay } = require('lib-wallet-pay-btc')
const { EthPay, Provider, erc20CurrencyFac, Erc20 } = require('lib-wallet-pay-eth')

/**
* this function is an example of how to setup various components of the wallet lib.
*/
async function main (config = {}) {
  // Generate seed for our wallet, if non exists.
  const seed = await BIP39Seed.generate(config?.seed?.mnemonic)

  // Setup wallet store class. This is our data store abstraction
  const store = new WalletStoreHyperbee({
    store_path: config.store_path
  })

  // Setup Bitcoin asset

  const btcPay = new BitcoinPay({
    // Asset name space
    asset_name: 'btc',
    // Asset's network
    network: config.network || 'regtest',
    electrum: {
      // optional TCP to Websocket adaptor. This will allow you to connect to a websocket electrum node
      net: require('./modules/ws-net.js'),
      host: config.electrum_host,
      port: config.electrum_port,
    }
  })


  // Ethereum data provider setup
  const provider = new Provider({
    web3: config.web3 || 'ws://127.0.0.1:8545/',
    indexer: config.web3_indexer || 'http://127.0.0.1:8008/',
    indexerWs: config.web3_indexer_ws || 'http://127.0.0.1:8181/'
  })
  await provider.init()

  // Create a USDT ERC20 currency instance
  const USDT = erc20CurrencyFac({
    name: 'USDT',
    base_name: 'USDT',
    contractAddress: config.token_contract || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    decimal_places: 6
  })

  const ethPay = new EthPay({
    asset_name: 'eth',
    provider,
    store,
    network: config.network || 'regtest',
    token: [
      new Erc20({
        currency: USDT
      })
    ]
  })

  // Setup Wallet facade class
  const wallet = new Wallet({
    store,
    seed,
    assets: [btcPay, ethPay]
  })

  await wallet.initialize()

  // Your application can now use this wallet instance within in your app.
  return wallet
}

module.exports = main
