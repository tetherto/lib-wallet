const config = require('./config.json')
const createWallet = require('../../src/wallet-lib.js')
const fs = require('fs')
const repl = require("repl");

async function main() {
  
  if(!config.store_path) {
    config.store_path = './data'
  }
  config.network = 'bitcoin'
  
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

function parseArgs(args, wallet) {

  let [name, token] = args.split(" ")

  let err 
  if(!name || !wallet.pay[name]) {
    err = true
    console.log('Please provide valid asset name')
  }

  if(token && token.indexOf("-") === 0) token = null
  const addrIndex = args.split(" ").indexOf('--addr')
  const address =  addrIndex > 0 ? args.split(" ")[addrIndex+1] : null
  
  const senderIndex = args.split(" ").indexOf('--sender')
  const sender =  senderIndex > 0 ? args.split(" ")[senderIndex+1] : null

  const amtIndex = args.split(" ").indexOf('--amt')
  const amt =  senderIndex > 0 ? args.split(" ")[amtIndex+1] : null

  return {
    name,token, err, address, amt, sender
  }
}

function startcli(wallet) {
  console.log(`Welcome to Seashell Wallet CLI`)
  console.log(`Type help to see available commands\n`)
  console.log(`commands:\n`)
  const commands = [
    [
      'paymethods',
      '.paymethods - List of payment methods \n Usage: .paymethods \n Example: .paymethods',
       async () => {
        console.log(`\nAvailable payment methods: \n`)
        for(let method of wallet.pay) {
          console.log(`>> Method: ${method.assetName}`)
          const tokens = method._tokens || new Map()
          if(tokens.size > 0) {
            for(let [tName, token] of tokens) {
              console.log(`    Token: ${tName} - ${token.getTokenInfo().contractAddress}`)
            }
          }
          console.log("---")
        }
      }
    ],
    [
      'newaddress',
      '.newaddress <asset> <token?> - Get new address  \n Usage: .newaddress <asset> <token>  \n Example:\n .newaddress btc \n .newaddress eth USDT',
      async (args) => {
        const {token,name, err} = parseArgs(args, wallet)
        if(err) return 
        const opts = {}
        if(token) opts.token = token
        const addr = await wallet.pay[name].getNewAddress(opts)
        console.log(addr)
      }
    ],
    [
      'sync',
      '.sync --reset - Sync wallet history  \n Usage: .sync --reset \n Example: .sync',
      async (reset)=> {
        const handler = (name, token) => {
          clog(`Synced ${name} ${token ? ': token: '+token : ""} asset`)
        }
        wallet.on('asset-synced', handler)
        await wallet.syncHistory({reset : reset === '--reset', all:true})
        wallet.off('asset-synced', handler)
        clog('wallet synced')
      }
    ],
    [
      'balance',
      '.balance <asset> <token> --addr <address> - Get balance of entire asset or address of an asset.\n Usage: .balance ',
      async (args)=> {
        const {token,name,address,err} = parseArgs(args, wallet)
        if(err) return 
        const opts = {}
        if(token) opts.token = token
        if(!address) {
          const balance = await wallet.pay[name].getBalance(opts)
          clog(`Balance of ${name}:`)
          console.log(balance)
        } else {
          const balance = await wallet.pay[name].getBalance(opts, address)
          clog(`Balance of ${name} at ${address}:`)
          console.log(balance)
        }
      }
    ],
    [
      'addr-bal',
      '.addr-bal <asset> <token> - list of address and their balances\n Usage: .addr-bal ',
      async (args)=> {
        const {token,name, err} = parseArgs(args, wallet)
        if(err) return 
        if(token) {
          const bal = await wallet.pay[name].getFundedTokenAddresses({token})
          console.log(bal)
        } else {
          const bal = await wallet.pay[name].getFundedTokenAddresses({})
          console.log(bal)
        }
      }
    ],
    [
      'send',
      '.send <asset> <token> --addr <receiver> --sender <sender> --amt <amount>  - Send some tokens to an address.\n Usage: .send <asset> <address> <amount in main unit> \n Example: .send btc bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu  100000',
      async (args)=> {
        const {token,name,address,sender, amt, err} = parseArgs(args, wallet)
        if(err) return 
        let opts = {}
        if(token) opts.token = token
        const tx = await wallet.pay[name].sendTransaction(opts, {address, amount:amt, unit: 'main', sender})
        console.log('sent')
        console.log(tx)
      }
    ],
    [
      'history',
      '.history <asset> <token> - Get history of transactions in this wallet.\n Usage .history btc',
      async (args) => {
        const {token,name, err} = parseArgs(args, wallet)
        const opts = {}
        if(token) opts.token = token 
        wallet.pay[name].getTransactions(opts, (tx) => {
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

