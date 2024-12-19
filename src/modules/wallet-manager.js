const { WalletStoreHyperbee } = require('lib-wallet-store')

const MAX_SUB_SIZE = 10000

class MultiWalletManager {
  constructor (opts, walletLoader) {
    this._store = new WalletStoreHyperbee({
      store_path: opts.store_path
    })
    this._store_path = opts.store_path
    this._wallets = new Map()
    this._walletLoader = walletLoader
    this._subs = new Map()
    if (!this._walletLoader) throw new Error('wallet loader must be passed')
  }

  async init () {
    await this._store.init()
  }

  async getWalletList () {
    return (await this._store.get('wallets')) || []
  }

  _updateWalletList (data) {
    return this._store.put('wallets', data)
  }

  getWallet (name) {
    return this._store.get(`wallet-${name}`)
  }

  async shutdown () {
    const res = []
    for (const [key, wallet] of this._wallets) {
      res.push(key)
      await wallet.destroy()
    }

    await this._store.close()
    this._wallets = new Map()

    return res
  }

  async resumeWallets () {
    for (const wallet of this._wallets) {
      await wallet[1].destroy()
    }
  }

  async addWallet (walletExport) {
    const walletList = await this.getWalletList()
    if (walletList.includes(walletExport.name)) {
      throw new Error('wallet already exists')
    }
    walletList.push(walletExport.name)
    await this._store.put(`wallet-${walletExport.name}`, walletExport)
    await this._updateWalletList(walletList)
  }

  async removeWallet (name) {
    const walletList = await this.getWalletList()
    delete walletList[name]
    await this._updateWalletList(walletList)
  }

  async _load (config) {
    const walletExp = await this.getWallet(config.name)
    const wallet = await this._walletLoader(walletExp)
    this._wallets.set(config.name, wallet)
    return wallet
  }

  async loadWallet (opts) {
    const res = await this._setupWallet(opts)
    return res.map((w) => w.walletName)
  }

  async _setupWallet (opts) {
    const walletList = await this.getWalletList()
    if (opts.all) {
      await Promise.all(walletList.map(async (walletName) => {
        const config = await this.getWallet(walletName)
        const wallet = await this._load(config)
        this._wallets.set(walletName, wallet)
      }))
      return walletList
    }
    const config = await this.getWallet(opts.name)
    if (!config) throw new Error('cant find wallet data')
    const wallet = await this._load(config, opts)
    this._wallets.set(opts.name, wallet)
    return [wallet]
  }

  async createWallet (opts = {}) {
    opts.name = opts.name || 'default'
    opts.store_path = opts.store_path || this._store_path
    let wallet = this._wallets.get(opts.name)
    if (wallet) throw new Error('wallet already exists with name')
    wallet = await this._walletLoader(opts)
    const walletExport = await wallet.exportWallet()

    this._wallets.set(wallet.walletName, wallet)
    await this.addWallet(walletExport)
    return walletExport
  }

  _subscribe (req, wallet, opts) {
    const eventName = this._getEventName(req)
    let eventKey

    if (this._subs.size === MAX_SUB_SIZE) throw new Error('memory leak: too many subscriptions')

    function eventHandler (...args) {
      try {
        req.notify(eventKey, [...args])
      } catch { }
    }

    if (opts === 'wallet') {
      eventKey = `${req.name}:${eventName}`
      wallet.on(eventName, eventHandler)
    } else if (opts === 'resource') {
      eventKey = `${req.name}:${req.namespace}-${req.resource}:${eventName}`
      wallet[req.namespace][req.resource].on(eventName, eventHandler)
    } else {
      throw new Error('invalid subscriptions opts')
    }

    this._subs.set(eventKey, eventHandler)

    return eventKey
  }

  _getEventName (req) {
    if (!Array.isArray(req.params)) throw new Error('req params must be an array')
    const eventName = req.params.shift()
    if (!eventName) throw new Error('event name is missing')
    return eventName
  }

  _getEventHandler (k) {
    const handler = this._subs.get(k)
    if (!handler) throw new Error('handler does not exist ' + k)
    return handler
  }

  _unsubscribe (req, wallet, opts) {
    let eventKey
    const eventName = this._getEventName(req)

    if (opts === 'wallet') {
      eventKey = `${req.name}:${eventName}`
      wallet.off(eventName, this._getEventHandler(eventKey))
    } else if (opts === 'resource') {
      eventKey = `${req.name}:${req.namespace}-${req.resource}:${eventName}`
      wallet[req.namespace][req.resource].off(eventName, this._getEventHandler(eventKey))
    } else {
      throw new Error('invalid unsub opts')
    }

    this._subs.delete(eventKey)

    return eventKey
  }

  async callWallet (req) {
    let wallet = this._wallets.get(req.name)
    if (!wallet) {
      wallet = await this._setupWallet({ name: req.name })
      if (!wallet || wallet.length === 0) throw new Error(`Wallet with name ${req.name} not found `)
      wallet = wallet.pop()
      this._wallets.set(req.name, wallet)
    }
    if (!wallet[req.namespace]) throw new Error('wallet doesnt have this namespace')

    if (req.namespace === 'on') {
      return this._subscribe(req, wallet, 'wallet')
    } else if (req.namespace === 'off') {
      return this._unsubscribe(req, wallet, 'wallet')
    }

    if (!wallet[req.namespace][req.resource]) throw new Error('wallet doesnt have this resource')

    if (req.method === 'on') {
      return this._subscribe(req, wallet, 'resource')
    } else if (req.method === 'off') {
      return this._unsubscribe(req, wallet, 'resource')
    }

    if (!wallet[req.namespace][req.resource][req.method]) throw new Error('wallet resource does not have that method name')

    if (Array.isArray(req.params)) {
      return wallet[req.namespace][req.resource][req.method](...req.params)
    }
    return wallet[req.namespace][req.resource][req.method](req.params)
  }
}

module.exports = MultiWalletManager
