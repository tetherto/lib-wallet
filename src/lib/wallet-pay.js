const { EventEmitter } = require('events')

const WalletPayError = Error

class WalletPay extends EventEmitter {
  constructor (config) {
    super()

    if (!config.asset_name) throw new WalletPayError('Asset name is required')
    if (!config.provider) throw new WalletPayError('Provider is required')
    if (!config.network) throw new WalletPayError('network is required')
    this.assetName = config.asset_name
    this.provider = config.provider
    this.keyManager = config.key_manager || null
    this.store = config.store || null
    this.network = config.network
    this.seed = config.seed || null
    this.ready = false
  }

  async initialize (ctx = { wallet = {}}) {
    console.log(123123312)
    // Not integrated into main wallet lib
    if (!this.store) this.store = wallet.store
    if (wallet.network) this.keyManager.setNetwork(this.network)
    this.keyManager.setSeed(wallet.seed || this.seed)
    wallet.registerAsset(this.assetName, this)
  }

  async _postDestroy () {
    this.removeAllListeners()
  }

  async getNewAddress (args) {
    throw new WalletPayError('Method not implemented')
  }

  async syncTransactions (args) {
    throw new WalletPayError('Method not implemented')
  }

  async pauseSync (args) {
    throw new WalletPayError('Method not implemented')
  }

  async getTransactions (opts) {}

  async getBalance (opts, addr) {}

  async sendTransaction (opts) {}

  async isValidAddress (addr) {}

  parsePath (path) {}
}

module.exports = WalletPay
