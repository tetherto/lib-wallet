
# Quick Start


## Table of Contents
1. [Simple CLI wallet](#create-your-own-wallet)
2. [Build a New Asset](./new-asset.md)

## Create your own wallet

### Prerequisites
- Setup your block source or have a URL to a remote node
    - Electrum and Bitcoin Core
    - Web3 and Wallet Indexer
- Latest version of Node.js

### Guide

#### 1. Wallet seed/mnemonic
In WDK, we use 1 seed phrase for all assets. To learn more [check out the course here.](https://planb.network/en/courses/cyp201)


```javascript
const BIP39Seed = require('wallet-seed-bip39')
const seed = await BIP39Seed.generate()
```

To reuse an existing seed phrase from a different wallet:
```javascript
const seed = await BIP39Seed.generate(<seed phrase here>)
```

The `seed` is now ready to be used to secure your assets.

#### 2. Database

In WDK we use a database to keep track of the overall state of the wallet. This includes things like balances, past transactions, addresses etc.

WDK does not depend on any particular database. Out of the box we support [Hyperbee](https://github.com/holepunchto/hyperbee), a distributed key value store.

```javascript
const store = new WalletStoreHyperbee({
    store_path: './path-to-data-dir'
})
await store.init()
```

If you do not want persistance storage and want to use in memory storage leave the `store_path` field as empty.

#### 3. Setup assets
Each blockchain/asset has it's own module that encapsulates all of the logic. Each asset can have it's own configuration.


Lets setup Bitcoin:
```javascript
const { BitcoinPay } = require('lib-wallet-pay-btc')
const btcPay = new BitcoinPay({
    // Asset name space
    asset_name: 'btc',
    // Asset's network
    network: 'regtest',
    electrum: {
      // optional TCP to Websocket adaptor. This will allow you to connect to a websocket electrum node
      net: require('./modules/ws-net.js'),
      host: "electrum-websocket host"
      port: "electrum-websocket port"
    }
})

```

Let's set-up Ethereum and USDt
```javascript
const { EthPay, Provider } = require('lib-wallet-pay-eth')
const { TetherCurrency } = require('lib-wallet')

// Ethereum data provider setup
const provider = new Provider({
    web3: "web3 endpoint" 
    indexer: "web3 indexer rpc endpoint"
    indexerWs: "web3 indexer websocket endpoint"
})

await provider.init()

const ethPay = new EthPay({
    asset_name: 'eth',
    provider,
    network : 'sepolia'
    token: [
        TetherCurrency.ERC20()
    ]
})

```

You've now setup Ethereum and USDt. You can now generate addresses and send and receive funds.

#### Putting it all together

We configure the main Wallet class with the assets we want to use:

```javascript
const wallet = new Wallet({
    store,
    seed,
    assets: [btcPay, ethPay]
})

await wallet.initialize()
```

The wallet is now setup and ready to be used.

### Use your wallet.

#### Generate addresses:

```javascript
// Generate Bitcoin address
await wallet.pay.btc.getNewAddress()

// Generate ETH / USDt  address
await wallet.pay.eth.getNewAddress()
```

#### Sync your wallet

WDK automatically listens to new incoming transactions for your latest transactions if you are online. When you close and reopen the wallet, you need to resync with the blockchain.

```javascript
await wallet.syncHistory()
```

#### Perform transactions

Check out some of the simple APIs available for building a wallet.


```javascript
await wallet.pay.btc({}, {
    address: <recipient>,
    amount: <quantity of bitcoin>,
    unit: <main or base>  // main = bitcoin base = satoshis. 
    fee: <in sats per bytes>
})


// Example: send 0,1 Bitcoin with 10 satsVbyte in fees
await wallet.pay.btc({}, {
    address: <recipient>,
    amount: 0.1,
    unit: 'base',
    fee:  10
})

```

#### Sending USDt on Ethereum 

```javascript
await wallet.pay.eth({
    token : 'USDT'
}, {
    address: <recipient>,
    amount: <quanity of USDT>,
    unit:  'main',
})
```


#### Wallet history

Transaction history now works via an iterator.

```javascript
// Get USDT transactions history.
await wallet.pay.eth.getTransactions({
    token : 'USDT',
}, (tx) => {
    // iterate through tx history
})
```


