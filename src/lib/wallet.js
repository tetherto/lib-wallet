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

  async initialize () {
    this.pay = new AssetList()
    await Promise.all(this._assets.map((asset) => {
      return this._initAsset(asset)
    }))
    this._assets = null
    this.emit('ready')
  }

  async _initAsset (asset) {
    try {
      await asset.initialize({ wallet: this })
    } catch (err) {
      console.log(err)
    }

    asset.on('new-tx', this._handleAssetEvent(asset.assetName, 'new-tx'))
    asset.on('new-block', this._handleAssetEvent(asset.assetName, 'new-block'))
  }

  _handleAssetEvent (assetName, evName) {
    return async (...args) => {
      this.emit(evName, assetName, ...args)
    }
  }

  async destroy () {
    await this.pay.forEach(asset => asset.destroy())
    this.seed = null
    await this.store.close()
    this.store = null
    this.pay = null
  }

  async addAsset (k, assetObj) {
    if (typeof k !== 'string') {
      return this._initAsset(k)
    }
    this.pay.set(k, assetObj)
  }

  async _sync (opts, asset) {
    await asset.syncTransactions(opts)
    this.emit('asset-synced', asset.assetName)
    if (opts.all) {
      const tokens = asset.getTokens()
      for (const [token] of tokens) {
        await asset.syncTransactions({ ...opts, token })
        this.emit('asset-synced', asset.assetName, token)
      }
    }
  }

  async syncHistory (opts = {}) {
    if (opts.asset) {
      const asset = this.pay[opts.asset]
      if (!asset) throw new Error('asset does not exist')
      return this._sync(opts, asset)
    }
    return await this.pay.each(async (asset) => {
      return this._sync(opts, asset)
    })
  }

  exportSeed () {
    return this.seed.exportSeed()
  }
}

module.exports = Wallet
