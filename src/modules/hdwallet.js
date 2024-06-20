class SyncState {
  constructor (config, gapLimit = 20, addrType){
    if(!config) config = {}
    this.gap = config.gap || 0
    this.gapEnd = config.gapEnd || gapLimit
    this.path = config.path || null
    this._gapLimit = gapLimit
    this._addrType = addrType || null
  }

  bump(tx) {
    this.gap += 1
    this.path = HdWallet.bumpIndex(this.path)
    if(tx) {
      this.gapEnd = this.gap + this._gapLimit
    }
  }

  isGapLimit() {
    return this.gap > this.gapEnd
  }

  setPath(path) {
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
  * @desc: Class to manage HD wallet paths only supports 84' paths'
  * @link: https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki
  * @desc:  m / purpose' / coin_type' / account' / change / address_index
  */
class HdWallet {
  /**
  * @param: {Object} config
  * @param: {Object} config.store - store to save paths
  */
  constructor (config) {
    this.store = config.store
    this.coinType = config.coinType 
    this._gapLimit = config.gapLimit || 20
    this.purpose = config.purpose
    this.coinType = config.coinType
    this._checkCoinArg(this.coinType)
    this._checkCoinArg(this.purpose)

    this.INIT_EXTERNAL_PATH =  `m/${this.purpose}/${this.coinType}/0'/0/0`
    this.INIT_INTERNAL_PATH =  `m/${this.purpose}/${this.coinType}/0'/1/0`
  }

  async init () {
    const currentPath = await this.store.get('current_internal_path')
    if (!currentPath) {
      await this.store.put('current_internal_path', this.INIT_INTERNAL_PATH)
      await this.store.put('current_external_path', this.INIT_EXTERNAL_PATH)
      await this.store.put('account_index', [this._formatAccountPath(this.INIT_EXTERNAL_PATH)])
    }
  }

  _checkCoinArg(arg) {
    if(!arg || arg[arg.length - 1] !== "'") throw new Error("coinType is required and must be like: 84' ")
  }

  async getSyncState (addrType) { 
    const state = await this.store.get('sync_state_'+addrType)
    if (!state) {
      return this._newSyncState(addrType)
    }
    return new SyncState(state, this._gapLimit, addrType)
  }

  _newSyncState (addrType) {
    let path
    if(addrType === 'internal') path = this.INIT_INTERNAL_PATH
    if(addrType === 'external') path = this.INIT_EXTERNAL_PATH

    return new SyncState({ path }, this._gapLimit, addrType)
  }

  async resetSyncState () {
    let state = this._newSyncState('internal')
    await this.store.put('sync_state_internal', state)
    state = this._newSyncState('external')
    await this.store.put('sync_state_external', state)
    return state
  }

  async setSyncState (state) {
    return this.store.put('sync_state_'+state._addrType, state)
  }


  async close () {
    return this.store.close()
  }

  addAddress(addr) {
    return this.store.put('addr:'+ addr.address , addr)
  }

  getAddress(addr) {
    return this.store.get('addr:'+ addr)
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

  async _processPath (syncType, fn) {
    const _signal = this._signal
    return new Promise((resolve, reject) => {

      const run = async () => {
        let res
        try {
          res = await fn(syncType, _signal)
        } catch(err) {
          console.log('Failed to iterate account:'+ syncType, err)
          return reject(err)
        }

        if(res === _signal.stop) return resolve(res)
        else if(res === _signal.hasTx) {
          syncType.bump(true)
          await this.updateLastPath(syncType.path)
        } else if (res === _signal.noTx) {
          syncType.bump(false)
        } else {
          throw new Error('Invalid signal returned')
        }
        await this.setSyncState(syncType)
        if(syncType.isGapLimit()) {
          return resolve(res)
        }
        run()
      }
      run()
    })
  }
  
  _signal = {
    hasTx:0,
    noTx: 1,
    stop: 2,
  }

  async eachAccount (arg1, arg2) {
    let addrType, fn
    if(typeof arg1 === 'function') {
      fn = arg1
      addrType = await this.store.get('current_sync_addr_type')
    } else {
      fn = arg2
      addrType = arg1
    }

    if(!addrType) {
      addrType = 'external'
      await this.store.put('current_sync_addr_type', addrType)
    }
    const gapLimit = this._gapLimit
    const accounts = await this.getAccountIndex()
    const syncState = await this.getSyncState(addrType)
    for (const account of accounts) {
      const [purpose, accountIndex] = account
      if (!syncState.path) {
        let path = addrType === 'external' ? this.INIT_EXTERNAL_PATH : this.INIT_INTERNAL_PATH
        path = HdWallet.setPurpose(path, purpose)
        path = HdWallet.setAccount(path, accountIndex)
        syncState.setPath(path)
      } 
      const res =  await this._processPath(syncState, fn)
      if(res === this._signal.stop) return 
    }

    if(addrType === 'external') {
      await this.store.put('current_sync_addr_type', 'internal')
      return this.eachAccount('internal', fn)
    }
  }
}

module.exports = HdWallet
