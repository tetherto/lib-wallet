const Wallet = require('./lib/wallet.js')
const { BitcoinPay, Provider } = require('lib-wallet-pay-btc')
const { regtestNode } = require('lib-wallet-pay-btc/test/test-helpers.js')
const { WalletStoreHyperbee } = require('lib-wallet-store')
const BIP39Seed = require('wallet-seed-bip39')

// TODO: Implement main function
// [] Generate Seed
// [] Setup wallet key manager
// [] Setup wallet store
// [] Setup wallet provide



async function newElectrum (config = {}) {
  config.host = 'localhost' || config.host
  config.port = '8001' || config.port
  config.store = config.store || new WalletStoreHyperbee()
  let e
  try {
    e = new Provider(config)
    await e.connect()
  } catch (err) {
    console.log('Error connecting to electrum', err)
  }
  return e
}

async function main (config) {

  const seed = await BIP39Seed.generate(config.seed_phrase)

  const store =  new WalletStoreHyperbee({
    store_path : config.store_path,
    hyperbee: config.hyperbee
  })

  const btcPay = new BitcoinPay({
    asset_name: 'btc',
    store,
    network: 'regtest'
  })

  const wallet = new Wallet({
    store,
    seed,
    assets: [btcPay]
  })

  await wallet.initialize()


  return wallet


}

module.exports = main
