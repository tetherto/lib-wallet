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
'use strict'
class Balances {
  constructor (val, state) {
    this.state = state
    this.value = new Map()
    for (const addr in val) {
      const d = val[addr]
      this.value.set(addr, this._newCurrency(d))
    }
  }

  _newCurrency () {
    return new this.state.Currency(...arguments)
  }

  async add (addr, balance) {
    const bal = this.value.get(addr)
    if (!bal) {
      this.value.set(addr, balance)
    } else {
      const newbal = bal.add(balance)
      this.value.set(addr, newbal)
    }
    await this.state.storeBalances(this)
    return balance
  }

  async setBal (addr, balance) {
    this.value.set(addr, balance)
    await this.state.storeBalances(this)
  }

  toJSON () {
    return Object.fromEntries(this.value)
  }

  getTotal () {
    let total = this._newCurrency(0, 'base')
    for (const value of this.value) {
      total = total.add(this._newCurrency(value[1]))
    }
    return total
  }

  async getAddrByBalance (amount) {
    for (const [addr, bal] of this.value) {
      if (bal.gte(amount)) {
        const addrObj = await this.state._hdWallet.getAddress(addr)
        if (!addrObj) throw new Error('Address missing from addr list')
        return addrObj
      }
    }
    return null
  }

  async getAll () {
    return this.value
  }
}

class StateDb {
  constructor (config) {
    this.store = config.store
    this._hdWallet = config.hdWallet
    this.Currency = config.Currency
    this._balances = null
    this._txIndex = null
  }

  async init () {
    await this.store.init()
  }

  async close () {
    return this.store.close()
  }

  storeBalances (balance) {
    this._balances = balance
    return this.store.put('current_balance', balance.toJSON())
  }

  async getBalances () {
    if (this._balances) return this._balances
    const bal = await this.store.get('current_balance')
    return new Balances(bal, this)
  }

  async getAddress (address) {
    return await this._hdWallet.getAddress(address)
  }

  getTxIndex () {
    return this.store.get('tx_index')
  }

  async updateTxIndex (i) {
    let index = await this.getTxIndex()
    if (!index) index = { earliest: i, latest: i }
    else if (i < index.earliest || !index.earliest) {
      index.earliest = i
    } else if (i > index.latest) {
      index.latest = i
    }
    this._txIndex = index
    return this.store.put('tx_index', index)
  }

  async storeTxHistory (data) {
    const i = Number(data.height)
    const blockTx = await this.getTxHistory(i)
    const exists = blockTx.filter(tx => {
      // Since there can be multiple txs with the same hash, we compare hash, to and from
      return tx.txid === data.txid && tx.to === data.to && tx.from === data.from
    }).length > 0
    if (exists) return
    blockTx.push(data)
    await this.updateTxIndex(i)
    return this.store.put('height:' + i, blockTx)
  }

  async getTxHistory (i) {
    const res = await this.store.get('height:' + i)
    if (!res) return []
    return res
  }

  reset () {
    this._balances = null
    this._txIndex = null
    return this.store.clear()
  }
}

module.exports = StateDb
