# 🤖 AI Agent Demo

An example local ai app powered by OLLAMA, Whispr and WSDK
Use your voice to control wallet!


⚠️ THIS IS A TEST WALLET ONLY. DON'T RISK REAL FUNDS ⚠️


### Dependencies

- Install [Wallet indexer](https://github.com/tetherto/lib-wallet-indexer)
- Install [Fulcrum Electrum](https://github.com/cculianu/Fulcrum)
- Install [Test tools](https://github.com/tetherto/wallet-lib-test-tools)
- Instance of [Whispr](https://github.com/fedirz/faster-whisper-server) for voice transcription 
- Instance of [Ollama](https://ollama.com/library/llama3.1:8b) 


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

# Run webpack config to build dependecies for the web
npm run build

# Run!
npm run serve

```
