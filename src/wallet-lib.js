const Wallet = require('./lib/wallet.js')
const { WalletStoreHyperbee } = require('lib-wallet-store')
const BIP39Seed = require('wallet-seed-bip39')
const { BitcoinPay } = require('lib-wallet-pay-btc')
const { EthPay, Provider, erc20CurrencyFac, Erc20 } = require('lib-wallet-pay-eth') 

async function main (config = {}) {

  const seed = await BIP39Seed.generate(config?.seed?.mnemonic)


  // Setup wallet store
  const store = new WalletStoreHyperbee({
    store_path: config.store_path
  })

  // Setup Bitcoin asset
  const btcPay = new BitcoinPay({
    asset_name: 'btc',
    network: 'regtest',
    electrum : {
      net: require('./modules/ws-net.js'),
      host: 'ws://127.0.0.1',
      port: 8002
    }
  })

  const provider = new Provider({
    web3: 'ws://127.0.0.1:8545/',
    indexer: 'http://127.0.0.1:8008/',
    indexerWs: 'http://127.0.0.1:8181/'
  })
  await provider.init()
  
  // Create a USDT currency instance
  const USDT = erc20CurrencyFac({
    name : 'USDT',
    base_name: 'USDT',
    contractAddress : '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    decimal_places: 6
  })

  const ethPay = new EthPay({
    asset_name: 'eth',
    provider,
    store,
    network: config.network || 'mainnet',
    token : [
      new Erc20({
        currency : USDT
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

  return wallet
}

module.exports = main
