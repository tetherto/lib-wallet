const { BitcoinPay, Provider } = require('lib-wallet-pay-btc')
const Wallet = require('./lib/wallet.js')
const { WalletStoreHyperbee } = require('lib-wallet-store')
const BIP39Seed = require('wallet-seed-bip39')

// TODO: Implement main function
// [] Generate Seed
// [] Setup wallet key manager
// [] Setup wallet store
// [] Setup wallet provide

async function main (config = {}) {

  // Generate seed or use provided seed phrase
  const seed = await BIP39Seed.generate(config.seed_phrase)

  // Setup wallet store
  const store = new WalletStoreHyperbee({
    store_path: config.store_path,
    hyperbee: config.hyperbee
  })

  // Setup Bitcoin asset
  const btcPay = new BitcoinPay({
    asset_name: 'btc',
    store,
    network: 'regtest'
  })

  // Setup Wallet facade class
  const wallet = new Wallet({
    store,
    seed,
    assets: [btcPay]
  })

  await wallet.initialize()

  return wallet
}

module.exports = main
