'use strict'

const { EventEmitter } = require('events')

const WalletError = Error

class Wallet extends EventEmitter {
  constructor (config) {
    super()
    if (!config.store) throw new WalletError('Store not provided', 'BAD_ARGS')
    if (!config.seed) throw new WalletError('Seed not provided', 'BAD_ARGS')
    if (!Array.isArray(config.assets)) throw new WalletError('Assets must be an array', 'BAD_ARGS')
    this.seed = config.seed
    this.store = config.store

    this._assets = config.assets
    this._pay = null
    this._store = config.store

    Object.defineProperty(this, 'seed', {
      value: config.seed,
      writable: false,
      enumerable: true
    })
  }

  async initialize (args) {
    this._pay = new Map()
    await Promise.all(this._assets.map(async (asset) => {
      await asset.initialize({ wallet: this })
    }))
    this.emit('ready')
  }

  async _eachAsset (fn) {
    for (const arr of this._pay.entries()) {
      await fn(arr[1])
    }
  }

  async destroy () {
    await this._eachAsset(asset => asset.destroy())
    this._pay.clear()
    this.seed = null
    await this.storer.close()
  }

  addAsset (k, assetObj) {
    const asset = this._pay.get(k)
    if (asset) throw new WalletError('Asset already exists')
    this._pay.set(k, assetObj)
  }

  pay (opts) {
    return this._getAsset(opts.asset)
  }

  async syncHistory (opts) {
    if (opts.asset) {
      return this._getAsset(opts.asset).syncTransactions(opts)
    }

    await this._eachAsset(asset => asset.syncTransactions(opts))
  }

  _getAsset (opts) {
    let k
    if (typeof opts === 'string') k = opts
    else if (typeof opts?.asset === 'string') k = opts.asset
    else throw new WalletError('wallet asset not passed')
    const asset = this._pay.get(k)
    if (!asset) throw new WalletError('asset does not exist ' + k)
    return asset
  }

  exportWallet () {

  }

  static importWallet (snapshot) {

  }

  getBalance () {

  }

  getTransactions () {

  }

  isValidAddress () {

  }
}

module.exports = Wallet
