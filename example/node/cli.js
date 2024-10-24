// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
let repl, fs


function clog (msg) {
  console.log('>> ' + msg)
}

function loadModules (opts) {
  if (!opts.repl) repl = require('repl')
  else repl = opts.repl

  if (!opts.fs) fs = require('fs')
  else fs = opts.fs
}

async function main (opts) {
  loadModules(opts)

  let config = opts.config
  let createWallet = opts.createWallet
  const configFile = process.argv[2] || './config.json'

  if (!opts.config) {
    config = require(configFile)
    if (!config.store_path) {
      config.store_path = process.argv[3] || './data'
    }
    createWallet = require('../../src/wallet-lib.js')
  }

  config.network = config.network || 'regtest'

  const wallet = await createWallet(config)
  if (!config.seed) {
    console.log('\n')
    console.log('No seed found in config, generating new seed')
    console.log('Seed will be stored in config.json')
    console.log('\n')
    console.log('Generated seed: ', wallet.seed.mnemonic)
    console.log('\n\n')
  }

  config.seed = JSON.parse(wallet.exportSeed())
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2))

  wallet.on('new-tx', (asset, tx) => {
    console.log('🟩Wallet state updated for asset: ', asset)
    console.log(tx)
  })

  startcli(wallet)
}

function parseArgs (args, wallet) {
  let [name, token] = args.split(' ')

  let err
  if (!name || !wallet.pay[name]) {
    err = true
    console.log('Please provide valid asset name')
  }

  if (token && token.indexOf('-') === 0) token = null
  const addrIndex = args.split(' ').indexOf('--addr')
  const address = addrIndex > 0 ? args.split(' ')[addrIndex + 1] : null

  const senderIndex = args.split(' ').indexOf('--sender')
  const sender = senderIndex > 0 ? args.split(' ')[senderIndex + 1] : null

  const amtIndex = args.split(' ').indexOf('--amt')
  const amt = amtIndex > 0 ? args.split(' ')[amtIndex + 1] : null

  const feeIndex = args.split(' ').indexOf('--fee')
  const fee = feeIndex > 0 ? args.split(' ')[feeIndex + 1] : null
  return {
    name, token, err, address, amt, sender, fee
  }
}

function startcli (wallet) {
  console.log('Welcome to Seashell Wallet CLI')
  console.log('Type help to see available commands\n')
  console.log('commands:\n')
  const commands = [
    [
      'paymethods',
      '.paymethods - List of payment methods \n Usage: .paymethods \n Example: .paymethods',
      async () => {
        console.log('\nAvailable payment methods: \n')
        for (const method of wallet.pay) {
          console.log(`>> Method: ${method.assetName}`)
          const tokens = method._tokens || new Map()
          if (tokens.size > 0) {
            for (const [tName, token] of tokens) {
              console.log(`    Token: ${tName} - ${token.getTokenInfo().contractAddress}`)
            }
          }
          console.log('---')
        }
      }
    ],
    [
      'newaddress',
      '.newaddress <asset> <token?> - Get new address  \n Usage: .newaddress <asset> <token>  \n Example:\n .newaddress btc \n .newaddress eth USDT',
      async (args) => {
        const { token, name, err } = parseArgs(args, wallet)
        if (err) return
        const opts = {}
        if (token) opts.token = token
        const addr = await wallet.pay[name].getNewAddress(opts)
        console.log(addr)
      }
    ],
    [
      'sync',
      '.sync --reset - Sync wallet history  \n Usage: .sync --reset \n Example: .sync',
      async (reset) => {
        const handler = (name, token) => {
          clog(`Synced ${name} ${token ? ': token: ' + token : ''} asset`)
        }
        wallet.on('asset-synced', handler)
        await wallet.syncHistory({ restart: reset === '--reset', all: true })
        wallet.off('asset-synced', handler)
        clog('wallet synced')
      }
    ],
    [
      'balance',
      '.balance <asset> <token> --addr <address> - Get balance of entire asset or address of an asset.\n Usage: .balance ',
      async (args) => {
        const { token, name, address, err } = parseArgs(args, wallet)
        if (err) return
        const opts = {}
        if (token) opts.token = token
        if (!address) {
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
      async (args) => {
        const { token, name, err } = parseArgs(args, wallet)
        if (err) return
        const fn = wallet.pay[name].getFundedTokenAddresses
        if (token) {
          const bal = await wallet.pay[name].getFundedTokenAddresses({ token })
          console.log(bal)
        } else {
          console.log(bal)
        }
      }
    ],
    [
      'send',
      '.send <asset> <token> --addr <receiver> --sender <sender> --amt <amount in main >  - Send some tokens to an address.\n Usage: .send <asset> <address> <amount in main unit> \n Example: .send btc bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu  100000',
      async (args) => {
        const { token, name, address, sender, amt, err, fee } = parseArgs(args, wallet)
        if (err) return
        const opts = {}
        if (token) opts.token = token
        const tx = await wallet.pay[name].sendTransaction(opts, { address, amount: amt, unit: 'main', sender, fee })
        console.log('sent')
        console.log(tx)
      }
    ],
    [
      'history',
      '.history <asset> <token> - Get history of transactions in this wallet.\n Usage .history btc',
      async (args) => {
        const { token, name, err } = parseArgs(args, wallet)
        if (err) return console.log(err)
        const opts = {}
        if (token) opts.token = token
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
  const r = repl.start('sea-shell🐚> ')
  commands.forEach(([cmd, msg, fn]) => {
    r.defineCommand(cmd, {
      help: msg,
      async action (name) {
        await fn(Array.from(arguments).join(' '))
      }
    })
  })
  Object.defineProperty(r.context, 'wallet', {
    configurable: false,
    enumerable: true,
    value: wallet
  })
  Object.defineProperty(r.context, 'help', {
    configurable: false,
    enumerable: true,
    get () {
      console.log('\n\n commands:\n\n -----')
      commands.forEach(([cmd, msg, fn]) => {
        console.log(msg)
        console.log()
      })
    }
  })
}

if (process.argv[0].includes('/bin/bare')) {
  module.exports = main
} else {
  main({})
}
