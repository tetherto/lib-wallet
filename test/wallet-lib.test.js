'use strict'

const test = require('brittle')
const newWallet = require('../src/wallet-lib.js')
const fs = require('fs')

const SEED_PHRASE = 'sell clock better horn digital prevent image toward sort first voyage detail inner regular improve'
function expectedWallet(){
  return newWallet({
    seed_phrase: SEED_PHRASE,
    store_path : './tmp',
    network: 'mainnet'
  })
}

function clearWalletLib(){
  fs.rmSync('./tmp', { recursive: true })
}


test('Load wallet with bitcoin asset', async function (t) {
  const wallet = await expectedWallet()
  t.ok(wallet, 'Wallet loaded')
  t.ok(wallet.seed.mnemonic === SEED_PHRASE, 'Seed phrase matches')
  t.ok(wallet.pay.size === 1, 'Wallet has 1 asset')
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
  const address =  await wallet.pay.btc.getNewAddress()
  const addr2 =  await wallet.pay.btc.getNewAddress()
  const pay = wallet.pay
  t.ok(address.address === 'bc1qxeyapzy3ylv67qnxjtwx8npd8ypjkuy8wlfzrp', 'Address matches')
  t.ok(address.publicKey === '02dd113743a3c8ba2607091a63084de90eef96d3d3d43d9cd3a768f7004068dfc3', 'WIF matches ')
  t.ok(address.WIF === 'KyTSm6ncpbgSupgm6CZ2PYgdahHfNuJ2dQQUykRnwwyWs7Wyzbw6', 'WIF matches ')
  console.log(address.path)
  t.ok(address.path === "m/84'/0'/0'/0/0", "path matches")
  await wallet.destroy()
})

