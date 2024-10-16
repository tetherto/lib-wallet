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

const EXTERNAL_ADDR = 'external'
const INTERNAL_ADDR = 'internal'

class SyncState {
  constructor (config, gapLimit = 20, addrType) {
    if (!config) config = {}
    this.gap = config.gap || 0
    this.gapEnd = config.gapEnd || gapLimit
    this.path = config.path || null
    this._gapLimit = gapLimit
    this._addrType = addrType || null
    this._max_depth = config.max_depth || 10000
  }

  bump (tx) {
    this.gap += 1
    this.path = HdWallet.bumpIndex(this.path)
    if (tx) {
      this.gapEnd = this.gap + this._gapLimit
    }
  }

  isGapLimit () {
    return this.gap > this.gapEnd
  }

  setPath (path) {
    this.path = path
  }

  toJSON () {
    return {
      gap: this.gap,
      gapEnd: this.gapEnd,
      path: this.path,
      _addrType: this._addrType
    }
  }
}

/**
  * @desc: Class to manage HD wallet paths
  * @link: https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki
  * @link: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
  * @desc:  m / purpose' / coin_type' / account' / change / address_index
  */
class HdWallet extends EventEmitter {
  /**
  * @param: {Object} config
  * @param: {Object} config.store - store to save paths
  */
  constructor (config) {
    super()
    this.store = config.store
    this.coinType = config.coinType
    this._gapLimit = config.gapLimit || 20
    this._max_depth = config.max_depth || 100000
    this.purpose = config.purpose
    this.coinType = config.coinType
    this._checkCoinArg(this.coinType)
    this._checkCoinArg(this.purpose)

    this.INIT_EXTERNAL_PATH = `m/${this.purpose}/${this.coinType}/0'/0/0`
    this.INIT_INTERNAL_PATH = `m/${this.purpose}/${this.coinType}/0'/1/0`
  }

  async init () {
    if (!this.store.ready) await this.store.init()
    const currentPath = await this.store.get('current_internal_path')
    if (!currentPath) {
      await this.store.put('current_internal_path', this.INIT_INTERNAL_PATH)
      await this.store.put('current_external_path', this.INIT_EXTERNAL_PATH)
      await this.store.put('account_index', [this._formatAccountPath(this.INIT_EXTERNAL_PATH)])
      await this.store.put('address_index', [])
    }
  }

  async close() {
    return this.store.close()
  }

  _checkCoinArg (arg) {
    if (!arg || arg[arg.length - 1] !== "'") throw new Error("coinType and purpose are required and must be like: 84' ")
  }

  async getSyncState (addrType) {
    const state = await this.store.get('sync_state_' + addrType)
    if (!state) {
      return this._newSyncState(addrType)
    }
    return new SyncState(state, this._gapLimit, addrType)
  }

  _newSyncState (addrType) {
    let path
    if (addrType === INTERNAL_ADDR) path = this.INIT_INTERNAL_PATH
    if (addrType === EXTERNAL_ADDR) path = this.INIT_EXTERNAL_PATH

    return new SyncState({
      path,
      max_depth: this._max_depth

    }, this._gapLimit, addrType)
  }

  async resetSyncState () {
    let state = this._newSyncState(INTERNAL_ADDR)
    await this.store.put('sync_state_internal', state)
    state = this._newSyncState(EXTERNAL_ADDR)
    await this.store.put('sync_state_external', state)
    await this._updateSyncAddrType(null)
    return state
  }

  async _setSyncState (state) {
    return this.store.put('sync_state_' + state._addrType, state)
  }

  async close () {
    return this.store.close()
  }

  getAllAddress () {
    return this.store.get('address_index')
  }

  async addAddress (addr) {
    const addrIndex = await this.getAllAddress()
    addrIndex.push(addr.address)
    await this.store.put('address_index', addrIndex)
    return this.store.put('addr:' + addr.address, addr)
  }

  getAddress (addr) {
    return this.store.get('addr:' + addr)
  }

  _formatAccountPath (path) {
    const parsed = HdWallet.parsePath(path)
    return [
      parsed.purpose, parsed.account
    ]
  }

  getAccountIndex () {
    return this.store.get('account_index')
  }

  getLastIntPath () {
    return this.store.get('current_internal_path')
  }

  async getLastExtPath () {
    return this.store.get('current_external_path')
  }

  /**
  * @description update last known address path
  */
  async updateLastPath (path) {
    const parsed = HdWallet.parsePath(path)
    if (parsed.change) {
      return this.store.put('current_internal_path', path)
    }
    return this.store.put('current_external_path', path)
  }

  static setPurpose (path, value) {
    const parsed = HdWallet.parsePath(path)
    parsed.purpose = value
    return HdWallet.mergePath(parsed)
  }

  static setAccount (path, account) {
    const parsed = HdWallet.parsePath(path)
    parsed.account = account + (account.slice(-1) === "'" ? '' : "'")
    return HdWallet.mergePath(parsed)
  }

  static bumpAccount (path) {
    const parsed = HdWallet.parsePath(path)
    parsed.account = (Number.parseInt(parsed.account.split("'").shift()) + 1) + "'"
    return HdWallet.mergePath(parsed)
  }

  static bumpIndex (path) {
    const parsed = HdWallet.parsePath(path)
    parsed.index += 1
    return HdWallet.mergePath(parsed)
  }

  static setChangeIndex (path, index) {
    const parsed = HdWallet.parsePath(path)
    parsed.change = 1
    parsed.index = index
    return HdWallet.mergePath(parsed)
  }

  static mergePath (path) {
    return `m/${path.purpose}/${path.coin_type}/${path.account}/${path.change}/${path.index}`
  }

  async getNewAddress (newAddr) {
    let path = await this.getLastExtPath()
    const res = newAddr(path)
    if (!res.addr.path) throw new Error('newAddr function returned invalid response')
    const addr = res.addr
    path = HdWallet.bumpIndex(addr.path)
    await this.updateLastPath(path)
    await this.addAddress(addr)
    return res
  }

  static parsePath (path) {
    const parts = path.split('/')
    if (parts.length !== 6) {
      throw new Error('Invalid HD path: ' + path)
    }
    return {
      purpose: parts[1],
      coin_type: parts[2],
      account: parts[3],
      change: +parts[4],
      index: +parts[5]
    }
  }

  _updateSyncAddrType (v) {
    return this.store.put('current_sync_addr_type', v)
  }

  async _processPath (syncType, fn) {
    const _signal = this._signal

    const run = async () => {
      let res
      try {
        res = await fn(syncType, _signal)
      } catch (err) {
        console.log('Failed to iterate account:' + syncType.path, err)
        throw new Error(err)
      }

      if (res === _signal.stop) return res
      else if (res === _signal.hasTx) {
        syncType.bump(true)
        await this.updateLastPath(syncType.path)
      } else if (res === _signal.noTx) {
        syncType.bump(false)
      } else {
        throw new Error('Invalid signal returned')
      }
      await this._setSyncState(syncType)
      if (syncType.isGapLimit()) {
        await this.resetSyncState()
        this.emit('reset-sync')
        return res
      }
      return false
    }

    let x = 0
    while (x <= this._max_depth) {
      x++
      const res = await run()
      if (res) return res
    }
  }

  _signal = {
    // @desc Transaction has been detected in the path. Bump gap count
    hasTx: 0,
    // @desc Transaction not detected in the path. continue loop.
    noTx: 1,
    // @desc Stop iterating over hd path. Breaks loop
    stop: 2
  }

  async _prepareEachAcct (arg1, arg2) {
    let addrType, fn
    if (typeof arg1 === 'function') {
      fn = arg1
      addrType = await this.store.get('current_sync_addr_type')
    } else if (typeof arg2 === 'function') {
      fn = arg2
      addrType = arg1
    } else {
      throw new Error('callback function not passed')
    }

    if (!addrType) {
      addrType = EXTERNAL_ADDR
      await this._updateSyncAddrType(addrType)
    }

    return {
      addrType,
      fn
    }
  }

  async eachAccount (arg1, arg2) {
    const { addrType, fn } = await this._prepareEachAcct(arg1, arg2)
    const accounts = await this.getAccountIndex()
    const syncState = await this.getSyncState(addrType)

    for (const account of accounts) {
      const [purpose, accountIndex] = account
      if (!syncState.path) {
        let path = addrType === EXTERNAL_ADDR ? this.INIT_EXTERNAL_PATH : this.INIT_INTERNAL_PATH
        path = HdWallet.setPurpose(path, purpose)
        path = HdWallet.setAccount(path, accountIndex)
        syncState.setPath(path)
      }
      const res = await this._processPath(syncState, fn)
      if (res === this._signal.stop) return
    }

    if (addrType === EXTERNAL_ADDR) {
      await this._updateSyncAddrType(INTERNAL_ADDR)
      return this.eachAccount(INTERNAL_ADDR, fn)
    }
  }
}

module.exports = HdWallet
