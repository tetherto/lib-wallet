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
const { test } = require('brittle')
const HdWallet = require('../src/modules/hdwallet.js')
const { WalletStoreHyperbee } = require('lib-wallet-store')
const assert = require('assert')

test('parsePath', async function (t) {
  const path = "m/44'/0'/1'/2/3"
  const parsed = HdWallet.parsePath(path)
  t.ok(parsed.purpose === "44'", 'purpose')
  t.ok(parsed.coin_type === "0'", 'coin_type')
  t.ok(parsed.account === "1'", 'account')
  t.ok(parsed.change === 2, 'change')
  t.ok(parsed.index === 3, 'index')
})

test('mergePath', async function (t) {
  const path = "m/44'/0'/1'/2/3"
  const parsed = HdWallet.parsePath(path)
  const merged = HdWallet.mergePath(parsed)
  t.ok(path === merged, 'merged path works')
})

test('should initialize wallet correctly', async (t) => {
  const store = new WalletStoreHyperbee()
  const wallet = new HdWallet({
    store,
    coinType: "0'",
    purpose: "84'"
  })

  t.ok(!await wallet.store.get('current_internal_path'), 'Internal path should not be set')
  await wallet.init()

  t.ok(await wallet.store.get('current_internal_path') === wallet.INIT_INTERNAL_PATH, 'Internal path should be set')
  t.ok(await wallet.store.get('current_external_path') === wallet.INIT_EXTERNAL_PATH, 'External path shoul be set')
  t.ok(Array.isArray(await wallet.store.get('account_index')), 'Account index should be an array')
  t.ok(Array.isArray(await wallet.store.get('address_index')), 'Address index should be an array')
})

test('HdWallet getNewAddress', async (t) => {
  const store = new WalletStoreHyperbee()
  const wallet = new HdWallet({
    store,
    coinType: "0'",
    purpose: "84'"
  })

  await wallet.init()

  const newAddrFn = (path) => ({
    addr: {
      address: 'newaddr123',
      path
    }
  })

  const newAddr = await wallet.getNewAddress('ext', newAddrFn)
  assert.strictEqual(newAddr.addr.address, 'newaddr123')
  assert.strictEqual(newAddr.addr.path, "m/84'/0'/0'/0/0")

  const updatedPath = await wallet.getLastExtPath()
  assert.strictEqual(updatedPath, "m/84'/0'/0'/0/1")

  const allAddresses = await wallet.getAllAddress()
  assert.deepStrictEqual(allAddresses, ['newaddr123'])
})

test('eachAccount: path', async function (t) {
  const store = new WalletStoreHyperbee()
  const hd = new HdWallet({
    store,
    coinType: "0'",
    purpose: "84'"
  })
  await hd.init({})

  async function tester (expect, name) {
    let count = 0
    await hd.eachAccount(name, async function (syncState, signal) {
      if (count > expect.length) throw new Error('count exceeded')
      const path = syncState.path
      t.ok(path === expect[count], name + ' paths match: ' + expect[count])
      count++
      if (count === expect.length) return signal.stop
      return signal.hasTx
    })
    t.ok(count === expect.length, name + ' path counter stop signal should work')
  }

  let expect = Array.from({ length: 10 }, (_, idx) => {
    return "m/84'/0'/0'/0/" + idx
  })

  await tester(expect, 'external')
  expect = Array.from({ length: 10 }, (_, idx) => {
    return "m/84'/0'/0'/1/" + idx
  })
  await tester(expect, 'internal')
})

test('eachAccount: gap limit', async function (t) {
  const store = new WalletStoreHyperbee()
  const hd = new HdWallet({
    store,
    coinType: "0'",
    purpose: "84'"
  })
  await hd.init({})

  async function gapLimitTest (gap, name) {
    t.comment('testing gap limit, with tx at index ' + gap + ' for ' + name)
    let count = 0
    let prevGapEnd
    await hd.eachAccount(name, async function (syncState, signal) {
      // We skip addr types that we are not testing for
      if (syncState._addrType !== name) return signal.noTx
      count++

      if (count === (gap + 1)) {
        t.ok(syncState.gapEnd >= prevGapEnd, 'gap end increased at ' + gap)
        return signal.noTx
      }

      prevGapEnd = syncState.gapEnd
      if (count > syncState.gapEnd) t.fail('count has gone above gap end')

      // Stop when gap end and count are equal
      if (count === syncState.gapEnd) return signal.stop

      // transaction is detected
      if (count === gap) return signal.hasTx
      return signal.noTx
    })
    t.ok(count === prevGapEnd, name + ' counter stopped at gap limit ' + (count - 1))
  }

  await gapLimitTest(10, 'external')
  await gapLimitTest(20, 'internal')
})

test('HdWallet static methods', (t) => {
  t.comment('test 84 path')
  let testPath = "m/84'/0'/0'/0/0"

  let bumpedAccount = HdWallet.bumpAccount(testPath)
  assert.strictEqual(bumpedAccount, "m/84'/0'/1'/0/0")

  let bumpedIndex = HdWallet.bumpIndex(testPath)
  assert.strictEqual(bumpedIndex, "m/84'/0'/0'/0/1")

  let changedIndex = HdWallet.setChangeIndex(testPath, 5)
  assert.strictEqual(changedIndex, "m/84'/0'/0'/1/5")

  let parsedPath = HdWallet.parsePath(testPath)
  assert.deepStrictEqual(parsedPath, {
    purpose: "84'",
    coin_type: "0'",
    account: "0'",
    change: 0,
    index: 0
  })

  t.comment('test 44 path')
  testPath = "m/44'/0'/0'/0/0"

  bumpedAccount = HdWallet.bumpAccount(testPath)
  assert.strictEqual(bumpedAccount, "m/44'/0'/1'/0/0")

  bumpedIndex = HdWallet.bumpIndex(testPath)
  assert.strictEqual(bumpedIndex, "m/44'/0'/0'/0/1")

  changedIndex = HdWallet.setChangeIndex(testPath, 5)
  assert.strictEqual(changedIndex, "m/44'/0'/0'/1/5")

  parsedPath = HdWallet.parsePath(testPath)
  assert.deepStrictEqual(parsedPath, {
    purpose: "44'",
    coin_type: "0'",
    account: "0'",
    change: 0,
    index: 0
  })
})

test('eachAccount: gap limit', async function (t) {
  const store = new WalletStoreHyperbee()
  const hd = new HdWallet({
    store,
    coinType: "0'",
    purpose: "84'"
  })
  await hd.init({})

  hd.on('reset-sync', () => {
    t.ok(true, 'sync reset')
  })

  await hd.eachAccount(async (state, signal) => {
    return signal.noTx
  })
})

test('eachAccount - respects the stop signal', async (t) => {
  const store = new WalletStoreHyperbee()
  const hd = new HdWallet({
    store,
    coinType: "0'",
    purpose: "84'"
  })
  await hd.init()

  let callCount = 0
  const counter = 5
  let lastPath

  await hd.eachAccount((syncState, signal) => {
    callCount++
    if (callCount === counter) {
      lastPath = syncState.path
      return signal.stop
    }
    return signal.noTx
  })
  const lp = await hd.getLastExtPath()
  t.ok(lp === hd.INIT_EXTERNAL_PATH, 'no new address found')

  t.ok(callCount === counter, 'Should stop after the first call when stop signal is returned')

  await hd.eachAccount((syncState, signal) => {
    t.ok(syncState.path === lastPath, 'resume after stop')
    return signal.stop
  })
})

test('eachAccount - handles hasTx signal correctly', async (t) => {
  const store = new WalletStoreHyperbee()
  const hd = new HdWallet({
    store,
    coinType: "0'",
    purpose: "84'"
  })
  await hd.init()

  let count = 0
  await hd.eachAccount(async (syncType, signal) => {
    count++
    if (count === 2) return signal.hasTx
    return signal.noTx
  })

  const lp = await hd.getLastExtPath()
  t.ok(lp === "m/84'/0'/0'/0/2", 'Should bump the path when hasTx signal is returned')
})
