'use strict'

const { EventEmitter } = require('events')
const AssetList = require('./asset-list.js')
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
  }

  async initialize (args) {
    this.pay = new AssetList()
    await Promise.all(this._assets.map(async (asset) => {
      await asset.initialize({ wallet: this })
      asset.on('new-tx',this._handleAssetEvent(asset.assetName, 'new-tx'))
      asset.on('new-block',this._handleAssetEvent(asset.assetName, 'new-block'))
    }))
    this._assets = null
    this.emit('ready')
  }

  _handleAssetEvent(assetName, evName) {
    return async (...args) => {
      this.emit(evName, assetName, ...args)
    }
  }

  async _eachAsset (fn) {
    for (const asset of this.pay) {
      await fn(asset)
    }
  }

  async destroy () {
    await this._eachAsset(asset => asset.destroy())
    this.seed = null
    await this.store.close()
    this.store = null
    this.pay = null
  }

  addAsset (k, assetObj) {
    return this.pay.set(k, assetObj)
  }

  async syncHistory (opts) {
    return await this._eachAsset(async (asset) => {
      await asset.syncTransactions(opts) 
      this.emit('asset-synced', asset.assetName)
    })
  }

  exportSeed () {
    return this.seed.exportSeed()
  }
}

module.exports = Wallet
