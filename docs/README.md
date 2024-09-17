# Developer Guide: Integrating new assets

This README provides a guide for developers looking to extend the `WalletPay` base class to integrate a new cryptocurrency, example: XYZ Coin, into the wallet system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Implementing XYZCoin Class](#implementing-xyzcoin-class)
4. [Extending WalletPay](#extending-walletpay)
5. [Implementing Core Methods](#implementing-core-methods)
6. [Testing Your Implementation](#testing-your-implementation)
7. [Best Practices](#best-practices)

## Prerequisites

- Familiarity with JavaScript and ES6 class syntax
- Understanding of the `WalletPay` base class and its methods
- Knowledge of XYZ Coin's blockchain specifics (e.g., address format, transaction structure)
- Access to XYZ Coin's blockchain API or node

## Getting Started

1. Create a new directory for your XYZ Coin implementation:
   ```
   mkdir wallet-pay-xyz
   cd wallet-pay-xyz
   ```

2. Initialize a new npm project and install necessary dependencies:
   ```
   npm init -y
   npm install lib-wallet 
   ```

## Implementing XYZCoin Class

Create a new file `xyz.currency.js` to define the XYZCoin class:

```javascript
const { Currency } = require('lib-wallet');
const BN = Currency._BN;

class XYZCoin extends Currency {
  constructor() {
    super(...arguments);
    this.name = 'XYZ'; // BTC in case of bitcoin 
    this.base_name = 'xyz'; // SATs in case of bitcoin
    this.decimal_places = 8; // Adjust based on XYZ Coin's specifications
  }

  // Implement any XYZ Coin-specific methods here. See currency.js to see all the methods that needs to be implemented
}

module.exports = XYZCoin;
```

## Extending WalletPay

Create a new file `wallet-pay-xyz.js` to extend the WalletPay class:

```javascript
const { WalletPay, HdWallet } = require('lib-wallet');
const XYZCoin = require('./xyz.currency');

class WalletPayXYZ extends WalletPay {
  constructor(config) {
    super(config);
    this.ready = false;
    this._halt = false;
    this._setCurrency(XYZCoin);
  }

  async initialize(ctx) {
    // Implement initialization logic
  }

  // Implement other required methods
}

module.exports = WalletPayXYZ;
```

### Other Components

Wallet components are modular by design. There are other components you can either integrate, develop or your own.

#### Block Data Provider
you should be splitting up your data provider into a seperate class.

### Data Store
Transaction history and wallet state is tracked using a key value store. We provide a key-value data store with WalletStoreHyperBee. You can build your own storage engine too! 


## Implementing Core Methods

Implement the following core methods in your `WalletPayXYZ` class:

1. `getNewAddress()`: Generate a new XYZ Coin address
2. `getTransactions(opts, fn)`: Retrieve transaction history
3. `getBalance(opts, addr)`: Get balance for the entire wallet or a specific address
4. `syncTransactions(opts)`: Sync transactions with the blockchain
5. `sendTransaction(opts, outgoing)`: Send XYZ Coins
6. `isValidAddress(address)`: Validate XYZ Coin addresses

Example implementation of `getNewAddress()`:

It's important to create new addresses using a [HD path standard](https://learnmeabitcoin.com/technical/keys/hd-wallets/) this will allow the wallet to be recreated with just a seed phrase and also makes the wallet compatible with other wallets.

```javascript
async getNewAddress() {
  const res = await this._hdWallet.getNewAddress((path) => {
    return this.keyManager.addrFromPath(path);
  });
  // Subscribe to updates for this address if necessary
  return res.addr;
}
```

## Testing Your Implementation

1. Create a test file `test-wallet-pay-xyz.js`:

```javascript
const WalletPayXYZ = require('./wallet-pay-xyz');

async function testWallet() {
  const wallet = new WalletPayXYZ({
    asset_name: 'XYZCoin',
    network: 'testnet',
    provider: 
    // Add other necessary configuration
  });

  await wallet.initialize();

  const newAddress = await wallet.getNewAddress();
  console.log('New Address:', newAddress);

  const balance = await wallet.getBalance({});
  console.log('Wallet Balance:', balance.toString());

  // Add more tests for other methods
}

testWallet().catch(console.error);
```

2. Run the test:
   ```
   node test-wallet-pay-xyz.js
   ```

## Best Practices

1. Event Emission: Emit appropriate events (e.g., 'new-tx', 'synced-path') to allow users to react to wallet state changes.
2. Configurability: Allow users to configure network, API endpoints, and other XYZ Coin-specific parameters.
3. Security: Ensure proper handling of private keys and sensitive data.
4. Testing: Implement comprehensive unit tests for your WalletPayXYZ class.
5. Documentation: Provide clear documentation for any XYZ Coin-specific features or limitations.

By following this guide, you should be able to create a functional WalletPayXYZ implementation that integrates XYZ Coin into the WalletPay system. Remember to thoroughly test your implementation and handle edge cases specific to XYZ Coin's blockchain.
