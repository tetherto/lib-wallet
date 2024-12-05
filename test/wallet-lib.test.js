'use strict'

const test = require('brittle')
const newWallet = require('../src/wallet-lib.js')
const fs = require('fs')
const ops = require('./test.ops.json')

const SEED_PHRASE = 'sell clock better horn digital prevent image toward sort first voyage detail inner regular improve'
function expectedWallet () {
  return newWallet({
    seed: { mnemonic: SEED_PHRASE },
    store_path: './tmp',
    ...ops
  })
}

function clearWalletLib () {
  fs.rmSync('./tmp', { recursive: true })
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
  t.teardown(async function () {
    await clearWalletLib()
  })
})

test('generate bitcoin address that match as expected', async function (t) {
  const wallet = await expectedWallet()
  const address = await wallet.pay.btc.getNewAddress()
  t.ok(address.address === 'bcrt1q2g8ruxp58fs9g34uj535tret0c03u2jkkzkj0w', 'Address matches')
  t.ok(address.publicKey === '03455b95b0ecea8bfb93ce8310e16d9315b2afe660b23ce69bc78c4966a8fd282f', 'WIF matches ')
  t.ok(address.WIF === 'cNgxAUw3gPjyJXcMe2e8h4qTZQ6YGYbHssrQfVByRoSXWJ6hTMKc', 'WIF matches ')
  t.ok(address.path === "m/84'/1'/0'/0/0", 'path matches')
  await wallet.destroy()
})
