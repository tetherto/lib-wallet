
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
    if(!this.coinType) throw new Error('coinType is required')
    this.purpose = config.purpose
    if(!this.purpose) throw new Error('purpose is required')

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

  async _processPath (addrType, path, fn) {
    let next = true
    return new Promise((resolve, reject) => {
      const run = () => {
        if (!next) return resolve()
        fn(path, () => {
          next = false
        }).then(() => {
          path = HdWallet.bumpIndex(path)
          process.nextTick(run)
        }).catch((e) => {
          console.log(e)
          throw new Error('Failed to iterate through accounts ' + e)
        })
      }
      process.nextTick(run)
    })
  }

  async eachAccount (addrType, state, fn) {
    const accounts = await this.getAccountIndex()
    for (const account of accounts) {
      const [purpose, accountIndex] = account
      let path = addrType === 'external' ? this.INIT_EXTERNAL_PATH : this.INIT_INTERNAL_PATH
      if (!state) {
        path = HdWallet.setPurpose(path, purpose)
        path = HdWallet.setAccount(path, accountIndex)
      } else {
        path = HdWallet.bumpIndex(state)
      }
      await this._processPath(addrType, path, fn)
    }
  }
}

module.exports = HdWallet
