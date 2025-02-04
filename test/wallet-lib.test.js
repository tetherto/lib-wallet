'use strict'

const { test } = require('brittle')
const newWallet = require('../example/node/wallet-lib.js')
const { BitcoinPay } = require('lib-wallet-pay-btc')
const BIP39Seed = require('wallet-seed-bip39')
const Wallet = require('../src/lib/wallet.js')
const { WalletStoreHyperbee } = require('lib-wallet-store')
const ops = require('./test.ops.json')

const SEED_PHRASE = 'sell clock better horn digital prevent image toward sort first voyage detail inner regular improve'
function expectedWallet () {
  return newWallet({
    seed: { mnemonic: SEED_PHRASE },
    store_path: null,
    ...ops
  })
}

test('Load wallet with bitcoin asset', async function (t) {
  const wallet = await expectedWallet()
  t.ok(wallet, 'Wallet loaded')
  t.ok(wallet.seed.mnemonic === SEED_PHRASE, 'Seed phrase matches')
  t.ok(wallet.pay.btc, 'Wallet has btc asset')
  t.ok(wallet.pay.btc.provider.isConnected(), 'Bitcoin is connected to electrum')
  await wallet.destroy()
  t.ok(wallet.seed === null, 'Seed destroyed')
  t.ok(!wallet.pay, 'Wallet asset list is destroyed')
  t.pass('Wallet destroyed')
})

test('generate bitcoin address that match as expected', async function (t) {
  const wallet = await expectedWallet()
  const address = await wallet.pay.btc.getNewAddress()
  t.ok(address.address === 'bcrt1q2g8ruxp58fs9g34uj535tret0c03u2jkkzkj0w', 'Address matches')
  t.ok(address.publicKey === '03455b95b0ecea8bfb93ce8310e16d9315b2afe660b23ce69bc78c4966a8fd282f', 'WIF matches ')
  t.ok(address.privateKey === 'cNgxAUw3gPjyJXcMe2e8h4qTZQ6YGYbHssrQfVByRoSXWJ6hTMKc', 'WIF matches ')
  t.ok(address.path === "m/84'/1'/0'/0/0", 'path matches')
  await wallet.destroy()
})

test('addAsset', async function (t) {
  const seed = await BIP39Seed.generate(SEED_PHRASE)
  const store = new WalletStoreHyperbee({})
  const wallet = new Wallet({
    store,
    seed,
    assets: []
  })

  await wallet.initialize()

  t.ok(wallet.pay.size === 0, 'no asset is loaded')

  const btcPay = new BitcoinPay({
    asset_name: 'btc',
    network: 'regtest',
    electrum: {
      net: require('../src/modules/ws-net.js'),
      host: ops.electrum_host,
      port: ops.electrum_port
    }
  })

  await wallet.addAsset(btcPay)

  t.ok(wallet.pay.btc, 'btc is loaded')
  const addr = await wallet.pay.btc.getNewAddress()
  t.ok(addr.address, 'got a new btc addr')
  wallet.destroy().catch((err)=>{
    throw err
  })
})

test('exportWallet', async (t) => {
  const wallet = await expectedWallet()
  const ex = await wallet.exportWallet()
  t.ok(typeof ex.name === 'string', 'wallet name is exported')
  t.ok(ex.seed.mnemonic === SEED_PHRASE, 'seed matches')
  t.ok(ex.assets[0].name === 'eth', 'eth export matches')
  t.ok(ex.assets[1].name === 'btc', 'btc export matches')
  wallet.destroy().catch((err)=>{
    throw err
  })
  t.end()
})


