const walletLoader = require('./wallet-loader')
const { WalletStoreHyperbee } = require('lib-wallet-store')

class MultiWalletManager {

  constructor(opts) {
    this._store = new WalletStoreHyperbee({
      store_path: opts.store_path
    })
    this._wallets = new Map()
  }

  async init() {
    await this._store.init()
  }

  getWalletList() {
    return this._store.get('wallets')
  }

  updateWalletList(data) {
    return this._store.put('wallets', data)
  }

  getWallet(name) {
    return this._wallets.get(`wallet-${name}`)
  }

  async addWallet(opts, walletExport) {
    if(!opts.name) return null
    const walletList = await this.getWalletList()
    walletList[opts.name] = opts
    await this._store.set(`wallet-${opts.name}`, walletExport)
    await this.updateWalletList(walletList)
  }

  async removeWallet(name) {
    const walletList = await this.getWalletList()
    delete walletList[name]
    await this.updateWalletList(walletList)
  }

  async _load(config, opts) {

    const walletExp  = await this.getWallet(config.name)
    const wallet = await walletLoader(walletExp, opts)
    this._wallets.set(config.name, wallet)
    return wallet
  }

  async loadWallet(opts) {
    const walletList = await this.getWalletList()
    if(opts.all) {
      for(const config in walletList) {
        await this._load(config, opts)
      }
      return
    }
    const config = walletList[opts.name]
    if(!config) return null
    return this._load(config, opts)
  }

  async createWallet(opts) {

    let wallet = this._wallets.get(opts.name)
    if(wallet) throw new Error('wallet already exists with name')
    
    wallet = await walletLoader(opts)

    this._wallets.set(wallet.walletName, wallet)

    return wallet.exportWallet() 
  }


  async callWallet(req) {
    let wallet = this._wallets.get(req.name)
    if(!wallet){
      wallet = await this.loadWallet({ name : req.name })
      if(!wallet) throw new Error(`Wallet with name ${req.name} not found `)
      wallet.set(req.name, wallet)
    }
    if(!wallet[req.namespace]) throw new Error('wallet doesnt have this namespace')
    if(!wallet[req.namespace][req.resource]) throw new Error('wallet doesnt have this resource')
    if(Array.isArray(req.params)) {
      return wallet[req.namespace][req.resource][req.method](...req.params)
    } 
    return wallet[req.namespace][req.resource][req.method](req.params)
  }

}

module.exports = MultiWalletManager
