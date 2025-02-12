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

class WalletPayError extends Error {}

function createBalance (Currency) {
  return class Balance {
    static name = `Balance ${Currency.name}`
    constructor (confirmed, pending, mempool) {
      this.confirmed = confirmed || new Currency(0, 'main')
      this.pending = pending || new Currency(0, 'main')
      this.mempool = mempool || new Currency(0, 'main')
      this.consolidated = this.confirmed.add(this.pending).add(this.mempool)
    }
  }
}

class TxEntry {
  static OUTGOING = 1

  static INCOMING = 0

  static INTERNAL = 2

  constructor (data) {
    if (!Array.isArray(data.from_address)) {
      this.from_address = [data.from_address]
    } else {
      this.from_address = data.from_address
    }

    if (!Array.isArray(data.to_address)) {
      this.to_address = [data.to_address]
    } else {
      this.to_address = data.to_address
    }

    this.fee = data.fee
    this.amount = data.amount
    this.fee_rate = data.fee_rate
    this.txid = data.txid
    this.direction = data.direction
    this.height = data.height
    this.currency = data.currency || data?.amount?.name || 'unk'

    let isValid = true
    if (!this.txid || this.from_address.length === 0 || this.to_address.length === 0 || !this.amount) {
      isValid = false
    }

    if (this.direction !== TxEntry.OUTGOING && this.direction !== TxEntry.INCOMING && this.direction !== TxEntry.INTERNAL) {
      isValid = false
    }

    if(data.to_address_meta) {
      this.to_address_meta = data.to_address_meta
    }

    Object.defineProperty(this, 'isValid', {
      value: isValid,
      writable: false,
      enumerable: false,
      configurable: false
    })
  }

  isOutgoing() {
    return this.direction === TxEntry.OUTGOING
  }

  isIncoming() {
    return this.direction === TxEntry.INCOMING
  }

  isInternal() {
    return this.direction === TxEntry.INTERNAL
  }
}

class WalletPay extends EventEmitter {
  constructor (config) {
    super()

    if (!config.asset_name) throw new WalletPayError('Asset name is required')
    if (!config.network) throw new WalletPayError('network is required')
    this.assetName = config.asset_name
    this.provider = config.provider
    this.keyManager = config.key_manager || null
    this.store = config.store || null
    this.network = config.network
    this.seed = config.seed || null
    this.ready = false
    this._tokens = new Map()
    if (config.token) {
      this.loadToken(config.token)
    }

    this._plugins = new Set()
    this._setModuleInfo()
  }

  _setModuleInfo () {
    let depth = 1
    let proto = Object.getPrototypeOf(this)
    while (proto && proto.constructor !== WalletPay) {
      depth++
      proto = Object.getPrototypeOf(proto)
    }
    const prepareStackTrace = Error.prepareStackTrace
    Error.prepareStackTrace = (_, stack) => stack
    const stack = new Error().stack
    Error.prepareStackTrace = prepareStackTrace
    const mod = require(stack[depth].getFileName() + '/../../package.json')
    this._module_info = {
      name: mod.name,
      version: mod.version
    }
  }

  async _getModuleInfo () {
    return this._module_info
  }

  _loadPlugin (mod) {
    if (this._plugins.has(mod)) throw new Error(`plugin ${mod} exists`)
    this._plugins.add(mod)
    this[mod].on('*', (ev, ...args) => {
      this.emit(ev, ...args)
    })

    if (!this[mod].expose) throw new Error('plugin has no expose array')
    this[mod].expose.forEach((fnName) => {
      if (this[fnName]) throw new Error(`module: ${mod} cant expose ${fnName}. Already exists`)
      this[fnName] = this[mod][fnName].bind(this[mod])
    })
  }

  async initialize (ctx = {}) {
    if (!ctx.wallet) return
    const wallet = ctx.wallet
    if (!this.store && !wallet.store) throw new Error('store is missing')
    if (!this.seed && !wallet.seed) throw new Error('seed is missing')
    // Use wallet's store for asset
    if (!this.store) this.store = wallet.store
    // Use wallet's seed for asset
    this.keyManager.setSeed(wallet.seed)
    // Add asset to wallet. Register itself
    await wallet.addAsset(this.assetName, this)
  }

  async updateProvider (config) {
    this.provider = new this.provider.constructor(config)
    await this.provider.connect()
    return this.provider
  }

  async callExt (mod, method, ...args) {
    if (!this[mod]) throw new Error(`Module ${mod} is not defined`)
    if (!this[mod][method]) throw new Error(`Module ${mod} has no method ${method}`)
    return this[mod][method](...args)
  }

  async destroy () {
    await this._destroy()
    this.removeAllListeners()
  }

  async getNewAddress () {
    throw new WalletPayError('Method not implemented')
  }

  async syncTransactions () {
    throw new WalletPayError('Method not implemented')
  }

  async pauseSync () {
    throw new WalletPayError('Method not implemented')
  }

  async getTransactions () {
    throw new WalletPayError('Method not implemented')
  }

  async getBalance () {
    throw new WalletPayError('Method not implemented')
  }

  async sendTransaction () {
    throw new WalletPayError('Method not implemented')
  }

  async isValidAddress () {
    throw new WalletPayError('Method not implemented')
  }

  async getFeeEstimate () {
    throw new WalletPayError('Method not implemented')
  }

  parsePath () {
    throw new WalletPayError('Method not implemented')
  }

  addToken (token) {
    if (!this._tokens.has(token.name)) throw new Error('Token already exists ' + token.name)
    this._tokens.set(token.name, token)
  }

  loadToken (tokens) {
    tokens.forEach((t) => {
      if (!t.name) throw new Error('token class missing name')
      this._tokens.set(t.name, t)
    })
  }

  getTokensKeys () {
    return Array.from(this._tokens.keys())
  }

  async _eachToken (fn) {
    if (!this._tokens) return
    for (const tk of this._tokens) {
      await fn(tk[1])
    }
  }

  async callToken (method, tokenName, argArr) {
    let tokens
    if (!tokenName) tokens = Array.from(this._tokens.keys())
    else if (typeof tokenName === 'string') tokens = [tokenName]
    else throw new Error(`invalid token name passed: ${tokenName}`)

    const res = await Promise.all(tokens.map((tName) => {
      const token = this._tokens.get(tName)
      if (!token) throw new Error(`token with name: ${tName} does not exist in _tokens`)
      const fn = token[method]
      if (typeof fn !== 'function') throw new Error(`Method ${method} does not exist in token ${tName}`)
      return fn.apply(token, argArr)
    }))

    return res.length === 1 ? res.pop() : res
  }

  async _initTokens (args) {
    return this._eachToken((token) => {
      return token.init(args)
    })
  }

  _setCurrency (curr) {
    this._Curr = curr
    this._Balance = createBalance(curr)
  }

  static createBalance (Currency) {
    return createBalance(Currency)
  }

  static TxEntry = TxEntry

  getTokens () {
    return this._tokens
  }
}

module.exports = WalletPay
