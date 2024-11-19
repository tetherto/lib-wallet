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


const { BitcoinPay } = require('lib-wallet-pay-btc')
const { EthPay, Provider, erc20CurrencyFac, Erc20 } = require('lib-wallet-pay-eth')
const { WalletStoreHyperbee } = require('lib-wallet-store')

const libs = {
  'lib-wallet-pay-btc' : setupBtc,
  'lib-wallet-pay-eth' : setupEth
}

const BIP39Seed = require('wallet-seed-bip39')

async function setupBtc(opts, config) {
  const btcPay = new BitcoinPay({
    asset_name: opts.key,
    network: config.network,
    electrum: {
      net: require('../modules/ws-net.js'),
      host: config.electrum_host,
      port: config.electrum_port
    }
  })
  return btcPay
}

async function setupEth(opts, config) {

  const provider = new Provider({
    web3: config.web3,
    indexer: config.web3_indexer,
    indexerWs: config.web3_indexer_ws
  })
  await provider.init()

  const tokens = opts.tokenConfig.map((token) => {
    if(token.tokenType !== 'ERC20') return null
    const Token = new Erc20({ 
      currency : erc20CurrencyFac({
        name: token.name,
        base_name: token.base_name,
        contract_address: token.contract_address,
        decimal_places: token.decimal_places
      })
    })

    return Token
  }).filter(Boolean)

  const ethPay = new EthPay({
    asset_name: opts.key,
    provider,
    network: config.network,
    token: tokens
  })

  return ethPay

}

async function importWallet(data, config, Wallet) {


  const seed = await BIP39Seed.generate(data.seed.mnemonic)

  const assets = await Promise.all(data.assets.map((asset) => {
    const setup = libs[asset.module]
    if(!setup) return null
    const mod = setup(asset, config)
    return mod
  }))
  
  const datadir = config.data_dir_memory ? null : './wallet-data-'+data.name

  const store = new WalletStoreHyperbee({
    store_path: datadir
  })
  
  const wallet = new Wallet({
    name: data.name,
    store,
    seed,
    assets
  })

  await wallet.initialize()

  return wallet


}

module.exports = importWallet
