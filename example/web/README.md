# 🐚  Seashell on Web

An example cli wallet used to demo the wallet lib.


⚠️ THIS IS A TEST WALLET ONLY. DON'T RISK REAL FUNDS ⚠️


### Dependencies

- Install [Wallet indexer](https://github.com/tetherto/lib-wallet-indexer)
- Install [Fulcrum Electrum](https://github.com/cculianu/Fulcrum)
- Install [Test tools](https://github.com/tetherto/wallet-lib-test-tools)


### Configuration
all the available config items for config.json.
```json
{
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
# install parent deps
cd ../../
npm install


# update config in ./index.js

# Compile to web
# NOTE: this will generate dis folder and move to this director
npx webpack --config webpack.config.js

# Run!
npm run serve

# Open dev tools in your browser to call the wallet lib
```
