### Wallet API 

### Classes 

WalletStore: Generic storage class. can be extended for various db/platforms. Inspired by hypercore's RAM.

PaymentProcessor: Generic payment processor. Developers can extend this class for adding new payment processor. Payment processors have uniform apis that are called from Wallet. Inspired by BFX's btc.coin.js lib. 

AssetKey: Generic asset key manager. Developer extend/implement methods of this class for building their own key manager for assets.

Wallet: Main Interface for developers to interact with the wallet. Global level apis for :
- import/export wallet 
- sync wallet 
- wallet events 
- access to low level asset api.

Currency: Encapsulation of currency logic. units, contract addr, conversion, symbols. To allow to 

Provider: Generic class that can optionally be used for assets that can have multiple remote nodes. Example: Bitcoin Core/Electrum


Example Wallet API calls:

Wallet Creation: 

const wallet = new Wallet([
  
  new BitcoinPayment({ //
    
    // unique name for accessing this asset. There could be multiple Bitcoin assets, example for bitcoin core .
    asset_name: "btc_electrum", 
    provider: new Electrum({ url : "blockstream.com"}), // can be BitcoinCore 
    
    // Modular Key manager.
    // Developers can create their own key manager by extending AssetKey class
    
    keyManager: new BitcoinKeys() 
  }),

  new USDTPayments({ 
    asset_name: 'usdt_eth'
    provider: "infura.com", 
    keyManager: new EthKeys(),
  }),
  ...etc
], {

  // Storage class. Wallet's ledger.
  store: WalletStore,
  seed: WalletSeed, // seed for wallet

  // any other future settings
})


Restore Wallet: 

//restore wallet, keys, missed tx.
const wallet = await Wallet.import(snapshot)
await wallet.sync()


### Example of high level wallet api: 
wallet.export(asset_name): Creates a dump of everything or just an asset needed to backup and restore wallet 
wallet.add(PaymentProcessor): add a new payment processor to the wallet 
wallet.remove(PaymentProcessor): add a new asset to the wallet 
wallet.sync(options): catch up on all or some missed transactions 
wallet.on('wallet-events'): global wallet events 
//etc


### Example of low level Asset api 
For accessing per asset events 
wallet low level asset api:
wallet.assetName.method()
wallet.btc.updateProvider()
wallet.btc.getBalance()
wallet.btc.getNewAddress()
wallet.btc.on('eventname'): asset level events 
wallet.btc.exportSeed()

### Tx syncing 


- Manual syncing by calling low level api refresh.
  - used when in the asset view of a wallet 
  - refreshing per asset 
  - compare remote head with local head. 
- Global asset  refresh:
  - track refreshes per asset
  - throttle syncing
    - rate limites
  - state managment of syncing
    - next asset, current asset, previous asset 
