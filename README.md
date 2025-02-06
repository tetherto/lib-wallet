<p align="center" width="400">
  <img src="./docs/logo.svg" width="400" />
</p>


# Wallet Dev Kit by Tether


Multi asset cryptocurrency wallet library in JavaScript.
Supported on 3 platforms:  Node.js, Browser, Bare Runtime

Checkout the website [here](https://wallet.tether.io/)

### ⚠️ Development Process 
The main branch is under active development and **not safe** for use and may result in loss of funds. Please only use _tagged releases_ for production use as they have been tested more thoroughly.



## ⭐ Features

🔑 **Non custodial:** not your keys, not your coins.

🧩 **Composable:** Single facade to interact with multiple assets and wallets

📦 **Modular:** All components are modular and can be used independently.

🛠️ **Extensible:** Easily add new asset, seed source, block source...etc

## 🔗 Blockchains

### [Bitcoin](https://github.com/tetherto/lib-wallet-pay-btc)
- Electrum block data source. Support for TCP and Websocket on browser. 
- P2WPKH / BIP84 address support.

### [USDT on Ethereum](https://github.com/tetherto/lib-wallet-pay-eth)
- Web3 and [Indexer](https://github.com/tetherto/lib-wallet-indexer) block data source.
- ERC20 support.
- BIP44 address generation.

| Blockchain   	|  Supported  | Token Protocol
|---	        |---	      |--
|  Bitcoin 	    |  ✅ 	      | -
|  Ethereum  	|  ✅ 	      | ERC20
|  Tron 	    |  ⌛ 	      | TRC20
|  TON 	        |   ⌛	      | Jettons
|  Avalanche 	|   ⌛	      | C-Chain
|  Solana 	    |  ⌛ 	      | Solana Token
|  Celo 	    |   ⌛	      | ERC20
|  Liquid 	    |  ⌛ 	      | Liquid Asset
|  Tezos 	    |  ⌛ 	      | Tezos Token
|  Aptos 	    |  ⌛ 	      | Fungible Asset
|  Cosmos 	    |  ⌛ 	      | ERC20
|  Near 	    |  ⌛ 	      | Near Token
|  Polkadot 	|  ⌛ 	      | AssetHub

### 🏗️ Architecture
<p align="center" width="10" height=10>
  <img src="./assets/architecture.png "  width="500"/>
</p>


### 🧩 Components and Links
The library  comes with all the components needed to build a wallet. You can also use these as an example to build your own components.

- [BIP39 Seed](https://github.com/tetherto/lib-wallet-seed-bip39): Generate BIP39 seed for all assets 
- [Key value store](https://github.com/tetherto/lib-wallet-store): Store transaction history and track state.
- [Blockchain indexer](https://github.com/tetherto/lib-wallet-indexer): Remote blockchain data provider
- [Test tools](https://github.com/tetherto/wallet-lib-test-tools): Tools for development and testing 
- [Documentation](https://wallet.tether.io/): Guides, documentation.
- [Bitcoin](https://github.com/tetherto/lib-wallet-pay-btc): Bitcoin asset integration.
- [Ethereum/ERC20](https://github.com/tetherto/lib-wallet-pay-eth): Ethereum and ERC20 integration.


### **</>**  Example Usage

Checkout [Quick start guide](./docs/) for more detailed guide.

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
    // List of assets that the wallet will support 
    assets: [ btcPay ]
  })

  // Start wallet and initialize
  // Connect to block source 
  // Add asset to wallet registry 
  await wallet.initialize()

  // Traverse wallet history of all assets and sync them. This might take a while depending on wallet size 
  await wallet.syncHistory(opts)


  // All payment features are namespaced under wallet.pay[asset_name][action](opts, ...args)
  // Get a new bitcoin address using api below
  const btcAddress = await wallet.pay.btc.getNewAddress()

  // Get Tx history

  await wallet.pay.btc.getTransactions({}, (tx) =>{
    // do something here 
  }))


  // Add Asset:
  wallet.addAsset()
  //done 

```

### Wallet API Documentation

## Constructor
```javascript
new Wallet(config)
```
Creates a new Wallet instance.

### Parameters
- `config` (Object):
  - `store` (Object): Required. Storage interface for the wallet
  - `seed` (Object): Required. Seed object for wallet initialization
  - `assets` (Array): Required. Array of asset objects to be managed by the wallet

### Throws
- `WalletError` with code 'BAD_ARGS' if required config parameters are missing or invalid

## Methods

### initialize()
```javascript
await wallet.initialize()
```
Initializes the wallet and all its assets. Emits 'ready' event when complete.

### destroy()
```javascript
await wallet.destroy()
```
Cleanly destroys the wallet instance, closing stores and network connections..

### addAsset(assetObj)
```javascript
await wallet.addAsset(assetObj)
```
Adds a new asset to the wallet.
- `assetObj` (Object): Asset instance to add

### syncHistory([options])
```javascript
await wallet.syncHistory({
    asset : 'asset-name' // sync only this asset
})

await wallet.syncHistory() /// sync everything
```
Synchronizes transaction history for assets.

#### Options
- `asset` (String): Optional. Sync specific asset name
- `all` (Boolean): Optional. If true, syncs all tokens for assets
- Additional options are passed to asset.syncTransactions()

### exportSeed()
```javascript
const seed = wallet.exportSeed()
```
Exports the wallet's seed data.

## Events

The wallet extends EventEmitter and emits the following events:

- `ready`: Emitted when wallet is fully initialized
- `new-tx`: Emitted when a new transaction is detected
  - Arguments: `(assetName, ...transactionDetails)`
- `new-block`: Emitted when a new block is detected
  - Arguments: `(assetName, ...blockDetails)`
- `asset-synced`: Emitted when an asset completes synchronization
  - Arguments: `(assetName, [token])`

## Properties

### pay
An AssetList instance containing all initialized assets. Available after initialization.


# Development

## 🚀 Getting started

The best way to get started developing:

1. Setup local development enviroment.
2. Configure example apps to connect to your local blockchains.
3. Start hacking on example apps.
After you have example apps running:
- Fork/modify existing assets
- Build new assets.

## 🐚 Seashell Example Wallet
There is a working example wallet that supports. This wallet can be used as an example for making your own integrations.
- [Node.js cli wallet](./example/node)
- [Bare runtime cli wallet](./example/bare)
- [AI Agent  wallet](./example/web)


## 🛠️ Dev Enviroment
The wallet is designed to work with local test enviroments. 
- See [Wallet test tools repo](https://github.com/tetherto/wallet-lib-test-tools) to setup local enviroments 
- Setup [wallet indexer](https://github.com/tetherto/lib-wallet-indexer) service

## 🍱 Building your own asset
See [guide](./docs) for how to add new assets

## 🧪 Testing
- [Brittle](https://github.com/holepunchto/brittle) is used for testing
- Tests included in this repo cover
    - Shared modules
    - Integration of various blockchains
- Each asset has it's own tests included in it's repo.



## Security 
For critical vulnerabilities and bug reports, please reach out to us at bounty@tether.io.
Your insights help us keep WDK by Tether secure and reliable!
