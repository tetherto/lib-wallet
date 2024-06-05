'use strict'

const { EventEmitter } = require('events')

const WalletError = Error

class AssetList {

  constructor() {
    this._define('size', 0)
    this._define('keys', [])
  }

  _define(k,v) {
    Object.defineProperty(this, k, {
      value: v,
      writable: true,
      configurable: true,
      enumerable: false
    })
  }

  set(k,v) {
    if(this.exists(k)) throw new Error('Asset already exists '+k)
    this.size++
    this[k] = v
    this.keys.push(k)
    return v
  }

  exists(k) {
    return !!this[k]
  }

  [Symbol.iterator]() {
    let index = 0;
    const items = this.keys
    return {
    next : () => {
        if (index < items.length) {
            return { value: this[items[index++]], done: false };
        } else {
            return { done: true };
        }
      }
    }
  }
}

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
    }))
    this._assets = null
    this.emit('ready')
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
    if (opts.asset) {
      return this._getAsset(opts.asset).syncTransactions(opts)
    }

    await this._eachAsset(asset => asset.syncTransactions(opts))
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
