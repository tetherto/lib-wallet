# Wallet Lib

Multi asset cryptocurrency wallet library in JavaScript.

## Features

- **Composible:** Single facade to interact with multiple assets and wallets
- **Modular:** All components are modular and can be used independently. 
- **Extensible:** Easily add new asset, seed, block source.


### Default Components and assets

- `wallet-seed-bip39` - BIP39 seed generation library.
- `wallet-store-hyperbee` - Hyperbee data store for wallet.
- `wallet-pay-btc` - Bitcoin payment asset.
- wallet-pay-usdt-eth - USDT asset on Ethereum network
- wallet-pay-usdt-trx - USDT asset on Tron network
- wallet-pay-usdt-ton - USDT asset on TON network

### Example Usage
```javascript

  const seed = await BIP39Seed.generate(/** seed phrase or leave empty to generate one */)

  // Setup wallet store. Modular data store for  writing data
  const store = new WalletStoreHyperbee({
    store_path: './wallet-store' // Leave empty to use in-memory store
  })

  // Setup Bitcoin asset
  const btcPay = new BitcoinPay({
    // Asset name is used to identify the asset in the wallet.
    // You can have multiple assets of same currency
    asset_name: 'btc',
    // Bitcoin network you'll be using
    network: 'regtest'
  })

  // Setup main wallet class
  const wallet = new Wallet({
    store,
    seed,
    assets: [btcPay]
  })

  // Start wallet and initialize
  // Connect to block source 
  // Add asset to wallet registry 
  await wallet.initialize()

  // Traverse wallet history of all accounts and sync them. This might take a while depending on wallet size 
  await wallet.syncHistory(opts)

  // Get a new bitcoin address using api below
  const btcAddress = await wallet.pay.btc.getNewAddress()

```
