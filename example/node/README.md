# 🐚  Seashell CLI Wallet Node.js app

An example cli wallet used to demo the wallet lib.


⚠️ THIS IS A TEST WALLET ONLY. DON'T RISK REAL FUNDS ⚠️


### Dependencies

- Install [Nodejs](https://nodejs.org/en)
- Install [Wallet indexer](https://github.com/tetherto/lib-wallet-indexer)
- Install [Test tools](https://github.com/tetherto/wallet-lib-test-tools)
- Install [Fulcrum Electrum](https://github.com/cculianu/Fulcrum)


### Configuration
all the available config items for config.json
```json
{
    "store_path" :  "./data",
    "network" : "regtest",
    "electrum_host" : "ws://127.0.0.1",
    "electrum_port" : 8002,
    "web3" : "ws://127.0.0.1:8545/",
    "web3_indexer" : "http://127.0.0.1:8008/",
    "web3_indexer_ws" : "http://127.0.0.1:8181/",
    "token_contract" : "0x5FbDB2315678afecb367f032d93F642f64180aa3"
}

```

### Setup
```bash
# install bare dependencies
npm install

# Create config.json file. This stores your seed phrase
echo "{}" > config.json

# Run!
node ./cli.js
```
