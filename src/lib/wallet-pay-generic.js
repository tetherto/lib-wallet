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
const HdWallet = require('../modules/hdwallet')
const Provider = require('../modules/provider')
const StateDb = require('../modules/state')
const WalletPay = require('./wallet-pay')

class WalletPayGeneric extends WalletPay {
  constructor (config) {
    super(config)
    this.config = config
    this.ready = false
    this._halt = false
    this._maxAddrsWatch = config.maxAddrsWatch || 5
  }

  async initialize (ctx) {
    if (!this.provider) {
      this.provider = await this._getDefaultProvider()
      this._loadPlugin('provider')
    }

    if (!this.keyManager) {
      this.keyManager = await this._getDefaultKeyManager()
    }

    await super.initialize(ctx)

    if (!this._hdWallet) {
      this._hdWallet = await this._getDefaultHdWallet()
    }

    if (!this.state) {
      this.state = await this._getDefaultState()
    }

    this._finishInit()
    this.ready = true
  }

  async _finishInit () {
    await this.state.init()
    await this._hdWallet.init()
    await this._initTokens(this)
    this._listenToEvents()
    await this._listenToLastAddress()
  }

  /**
   * @returns {Promise<Provider>}
   */
  async _getDefaultProvider () {
    const provider = new Provider({
      indexer: this.config.indexer,
      indexerWs: this.config.indexerWs
    })
    await provider.init()

    return provider
  }

  /**
   * @returns {Promise<any>}
   */
  async _getDefaultKeyManager () {
    throw new Error('not implemented')
  }

  /**
   * @returns {Promise<object>} Address object
   */
  async getNewAddress () {
    const res = await this._hdWallet.getNewAddress('ext', async path => {
      return await this.keyManager.addrFromPath(path)
    })
    const tokenContracts = this._getTokenAddrs()
    this.provider.subscribeToAccount(res.addr.address, tokenContracts)

    return res.addr
  }

  async _getDefaultHdWallet () {
    const currency = new this._Curr(0, 'base')
    const currencyName = currency.name?.toLowerCase()
    if (!currencyName) {
      throw new Error('Currency name is required')
    }

    if (!currency.coinType) {
      throw new Error('Currency coin type is required')
    }

    // cointype and purpose : https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    const hdWallet = new HdWallet({
      store: this.store.newInstance({ name: `hdwallet-${currencyName}` }),
      coinType: `${currency.coinType}'`,
      purpose: "44'"
    })

    return hdWallet
  }

  async _getDefaultState () {
    const currency = new this._Curr(0, 'base')
    const currencyName = currency.name?.toLowerCase()
    if (!currencyName) {
      throw new Error('Currency name is required')
    }

    return new StateDb({
      store: this.store.newInstance({ name: `state-${currencyName}` }),
      hdWallet: this._hdWallet,
      Currency: this._Curr
    })
  }

  async _destroy () {
    this.ready = false
    await this.callToken('_destroy', null, [])
    await this.provider.stop()
    await this._hdWallet.close()
    await this.state.close()
    await this.store.close()
  }

  async pauseSync () {
    this._halt = true
  }

  async resumeSync () {
    this._halt = false
  }

  async _listenToLastAddress () {
    const addrs = await this._hdWallet.getAllAddress()
    const tokens = this._getTokenAddrs()
    return Promise.all(addrs.slice(this._maxAddrsWatch * -1).map((addr) => {
      return this.provider.subscribeToAccount(addr, tokens)
    }))
  }

  _listenToEvents () {
    this.provider.on('subscribeAccount', async (err, res) => {
      if (err) {
        console.trace(err)
        return
      }

      if (res.token) {
        this._eachToken(async (token) => {
          if (token.tokenContract.toLowerCase() !== res?.token.toLowerCase()) return
          const tx = await token.updateTxEvent(res)
          this.emit('new-tx', {
            token: token.name,
            address: res.address,
            value: tx.value,
            from: tx.from,
            to: tx.to,
            height: res.height,
            txid: tx.txid
          })
        })

        return
      }
      const tx = await this._storeTx(res.tx)
      await this._setAddrBalance(res.addr)
      this.emit('new-tx', { tx })
    })
  }

  _onNewTx () {
    return new Promise((resolve) => {
      this.once('new-tx', resolve)
    })
  }

  _getTokenAddrs () {
    return Array.from(this.getTokens()).map((t) => {
      return t[1]?.tokenContract
    }).filter(Boolean)
  }

  /**
   * Get wallet tx history
   * @param {object} opts
   * @param {string=} opts.token name of token for token tx history
   * @param {function} fn callback function for transactions
   * @returns {Promise}
   */
  async getTransactions (opts, fn) {
    const state = await this._getState(opts)
    const txIndex = await state.getTxIndex()

    if (!txIndex || !txIndex.earliest) return
    if (!txIndex.latest) txIndex.latest = txIndex.earliest

    for (let x = txIndex.earliest; x <= txIndex.latest; x++) {
      const block = await state.getTxHistory(x)
      if (!block || block.length === 0) continue
      await fn(block)
    }
  }

  /**
   * Get balance of entire wallet or 1 address
   * @param {object} opts options
   * @param {string=} opts.token token name, for getting balance of token
   * @param {string} addr Pass address to get balance of specific address
   * @returns {Promise<Balance>}
   */
  async getBalance (opts, addr) {
    if (opts.token) return this.callToken('getBalance', opts.token, [opts, addr])
    if (!addr) {
      const balances = await this.state.getBalances()
      return new this._Balance(balances.getTotal())
    }
    const bal = await this._getAddressBalance(addr)
    return new this._Balance(
      new this._Curr(bal, 'base'), // confirmed
      new this._Curr(0, 'base'), // pending
      new this._Curr(0, 'base') // mempool
    )
  }

  /**
   * @param {string} addr
   * @returns {Promise<any>}
   */
  async _getAddressBalance (addr) {
    throw new Error('not implemented')
  }

  async _getState (opts = {}) {
    let state = this.state
    if (opts.token) {
      state = await this.callToken('getState', opts.token, [])
    }
    return state
  }

  /**
   * @param {string} addr
   * @param {any} signal
   * @param {StateDb=} stateInstance
   */
  async _syncAddressPath (addr, signal, stateInstance = undefined) {
    const provider = this.provider
    const path = addr.path
    const txs = await provider.getTransactionsByAddress({ address: addr.address })
    if (txs.length === 0) {
      this.emit('synced-path', path)
      return signal.noTx
    }

    this._hdWallet.addAddress(addr)
    for (const t of txs) {
      await this._storeTx(t, stateInstance)
    }
    await this._setAddrBalance(addr.address, stateInstance)

    const txIndex = await stateInstance.getTxIndex()
    console.log('txIndex', txIndex)

    return txs.length > 0 ? signal.hasTx : signal.noTx
  }

  async _setAddrBalance (addr, stateInstance = undefined) {
    const state = stateInstance ?? this.state

    const balances = await state.getBalances()
    const bal = await this.getBalance({}, addr)
    await balances.setBal(addr, bal.confirmed)
  }

  async _storeTx (tx, stateInstance = undefined) {
    const state = stateInstance ?? this.state

    const data = {
      from: tx.from,
      to: tx.to,
      value: new this._Curr(tx.value, 'base'),
      height: tx.blockNumber,
      txid: tx.hash
    }
    await state.storeTxHistory(data)
    return data
  }

  /**
   * Crawl HD wallet path, collect transactions and calculate balance of all addresses.
   * @param {object} opts
   * @param {boolean=} opts.reset Reset all state and resync
   * @param {string=} opts.token Token name
   * @fires sync-path when a hd path is synced
   * @fires sync-end when entire HD path has been traversed, or when syncing is halted
   * @return {Promise}
   */
  async syncTransactions (opts = {}) {
    let { keyManager, state } = this

    if (opts.token) {
      state = await this.callToken('getState', opts.token, [])
    }

    if (opts?.reset) {
      await state._hdWallet.resetSyncState()
      await state.reset()
    }

    await state._hdWallet.eachAccount(async (syncState, signal) => {
      if (this._halt) return signal.stop
      const { addr } = await keyManager.addrFromPath(syncState.path)
      if (opts.token) {
        return this.callToken('syncPath', opts.token, [addr, signal])
      }

      const res = await this._syncAddressPath(addr, signal, state)
      this.emit('synced-path', syncState._addrType, syncState.path, res === signal.hasTx, syncState.toJSON())
      return res
    })

    if (this._halt) {
      this.emit('sync-end')
      this.resumeSync()
      return
    }
    this.resumeSync()
    this.emit('sync-end')
  }
}

module.exports = WalletPayGeneric
