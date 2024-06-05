'use strict'

const test = require('brittle')
const newWallet = require('../src/wallet-lib.js')

const SEED_PHRASE = 'sell clock better horn digital prevent image toward sort first voyage detail inner regular improve'

test('Load wallet with bitcoin asset', async function (t) {
  const wallet = await newWallet({
    seed_phrase: SEED_PHRASE
  })

  t.ok(wallet, 'Wallet loaded')
  t.ok(wallet.seed.mnemonic === SEED_PHRASE, 'Seed phrase matches')
  t.ok(wallet.pay.size === 1, 'Wallet has 1 asset')
  t.ok(wallet.pay.btc, 'Wallet has btc asset')
  t.ok(wallet.pay.btc.provider.isConnected(), 'Bitcoin is connected tot electrum')
  await wallet.destroy()
  t.ok(wallet.seed === null, 'Seed destroyed')
  t.ok(!wallet.pay, 'Wallet asset list is destroyed')
  t.pass('Wallet destroyed')
})

test('generate bitcoin address', async function (t) {
  const wallet = await newWallet()

  const address =  await wallet.pay.btc.getNewAddress()
  const pay = wallet.pay
  const z = await pay.btc.getNewAddress()
  console.log(z)
  t.ok(address.address, 'Address generated')
  t.ok(address.WIF, 'WIF generated')
  await wallet.destroy()
})

