const config = require('./config.json')
const createWallet = require('../src/wallet-lib.js')
const fs = require('fs')
const repl = require("repl");

async function main() {
  
  if(!config.store_path) {
    config.store_path = './data'
  }
  config.network = 'regtest'

  const wallet = await createWallet(config)
  
  if(!config.seed) {
    console.log('\n')
    console.log('No seed found in config, generating new seed')
    console.log('Seed will be stored in config.json')
    console.log('\n')
    console.log('Generated seed: ', wallet.seed.mnemonic)
    console.log('\n')
    console.log('\n')
  }

  config.seed = JSON.parse(wallet.exportSeed())
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2))

  wallet.on('new-tx', (asset) => {
    console.log('🟩Wallet state updated for asset: ', asset)
    
  })

  startcli(wallet)
}

function clog(msg) {
  console.log('>> '+msg)
}

function startcli(wallet) {
  console.log(`Welcome to Seashell Wallet CLI`)
  console.log(`Type help to see available commands\n`)
  console.log(`commands:\n`)
  const commands = [
    [
      'newaddress',
      '.newaddress <asset-name> - Get new address  \n Usage: .newaddress <asset-name> \n Example: .newaddress btc',
      async (name) => {
        if(!name || !wallet.pay[name]) return console.log('Please provide valid asset name')
        const addr = await wallet.pay[name].getNewAddress()
        console.log(addr)
      }
    ],
    [
      'sync',
      '.sync --reset - Sync wallet history  \n Usage: .sync --reset \n Example: .sync',
      async (reset)=> {
        const handler = (name) => {
          clog(`Synced ${name} asset`)
        }
        wallet.on('asset-synced', handler)
        await wallet.syncHistory({reset : reset === '--reset'})
        wallet.off('asset-synced', handler)
        clog('wallet synced')
      }
    ],
    [
      'balance',
      '.balance <asset> <address> - Get balance of entire asset or address of an asset.\n Usage: . --reset \n Example: .sync',
      async (cmd)=> {
        const [asset, address] = cmd.split(' ')
        if(!asset || !wallet.pay[asset]) return console.log('Please provide valid asset name')
        if(!address) {
          const balance = await wallet.pay[asset].getBalance()
          clog(`Balance of ${asset}:`)
          console.log(balance)
        } else {
          const balance = await wallet.pay[asset].getBalance({}, address)
          clog(`Balance of ${asset} at ${address}:`)
          console.log(balance)
        }
      }
    ],
    [
      'send',
      '.send <asset> <address> <amount> - Send some tokens to an address.\n Usage: .send <asset> <address> <amount in base unit> \n Example: .send btc bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu  100000',
      async (cmd)=> {
        const [asset, address, amount] = cmd.split(' ')
        if(!asset || !wallet.pay[asset]) return console.log('Please provide valid asset name')
        if(!address) return console.log('Please provide valid address')
        if(!amount) return console.log('Please provide valid amount')
        const tx = await wallet.pay[asset].sendTransaction({}, {address, amount, unit: 'base', fee: 10})
        console.log(`Transaction sent: ${tx.txid}`)
        console.log('sent to : ', address)
        console.log('amount: ', amount)
        console.log('change address: ', tx.changeAddress.address)
        console.log('Fee paid (sats): ', tx.totalFee)
      }
    ],
    [
      'history',
      '.history <asset>  - Get history of transactions in this wallet.\n Usage .history btc',
      async (cmd) => {
        console.log(cmd)
        wallet.pay[cmd].getTransactions((tx) => {
          console.log(tx)
        })
      }
    ]
  ]
  commands.forEach(([cmd, msg, fn]) => {
    console.log(msg)
    console.log()
  })
  const r = repl.start("sea-shell🐚> ")
  commands.forEach(([cmd, msg, fn]) => {
    r.defineCommand(cmd, {
      help: msg,
      async action(name){
        await fn(name)
        this.displayPrompt();
      },
    })
  })
  Object.defineProperty(r.context, 'wallet', {
    configurable: false,
    enumerable: true,
    value: wallet,
  });
  Object.defineProperty(r.context, 'help', {
    configurable: false,
    enumerable: true,
    get () {
      console.log('\n\n commands:\n\n -----')
      commands.forEach(([cmd, msg, fn]) => {
        console.log(msg)
        console.log()
      })
    },
  });

}
main()

// update balance states when a new block comes in 
// get tx history
