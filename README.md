# Wallet Lib

Multi asset cryptocurrency wallet library in JavaScript. Working in Node.js, Browser, Bare.js

**Warning:** This is a work in progress and not tested on mainnet.**

## Features

- **Composable:** Single facade to interact with multiple assets and wallets
- **Modular:** All components are modular and can be used independently.
- **Extensible:** Easily add new asset, seed source, block source...etc

### Default Components and assets

- `wallet-seed-bip39` - BIP39 seed generation library.
- `wallet-store-hyperbee` - Hyperbee data store for wallet.
- `wallet-pay-btc` - Bitcoin payment asset with Electrum backend. 
- `wallet-pay-eth` - Ethereum and ERC20 payment asset with Web3 backend and custom blocksource
- `lib-wallet-indexer-eth` - Ethereum indexer backend.
- `wallet-test-tools` - Tools for development and testing 

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
    // List of assets 
    assets: [ btcPay, ]
  })

  // Start wallet and initialize
  // Connect to block source 
  // Add asset to wallet registry 
  await wallet.initialize()

  // Traverse wallet history of all assets and sync them. This might take a while depending on wallet size 
  await wallet.syncHistory(opts)

  // Get a new bitcoin address using api below
  const btcAddress = await wallet.pay.btc.getNewAddress()

  // Get Tx history

  await wallet.pay.btc.getTransactions((tx) =>{}
    // do something here 
  }))
  //done 

```

### Sea-shell CLI

sea-shell is a basic terminal wallet built with this library. It supports multiple assets and basic wallet operations.

```bash
node ./examples/cli.js
```


### Browser support

Webpack.config.js has been provided to allow you to build for the browser.
We have also provided a demo website to try out the app in the browser.

```
// Generate dis module
npx webpack --config webpack.config.js
// (optional) Update example web app 
rm -rf example/web/dist/ && mv dist example/web && cd ./example/web
// Serve http server (use any http server) 
python -m http.server 8080
```

### Development Requirements
- Bitcoin Core node running on regtest
- [ElectrumX](https://electrumx-spesmilo.readthedocs.io/en/latest/)
- [Ethereum HardHat](https://hardhat.org/hardhat-network/docs/overview)

