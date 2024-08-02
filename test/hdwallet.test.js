const test = require('brittle')
const HdWallet = require('../src/modules/hdwallet.js')
const { WalletStoreHyperbee } = require('lib-wallet-store')

test('hdwallet', async function (t) {
  t.test('parsePath', async function (t) {
    const path = "m/44'/0'/1'/2/3"
    const parsed = HdWallet.parsePath(path)
    t.ok(parsed.purpose === "44'", 'purpose')
    t.ok(parsed.coin_type === "0'", 'coin_type')
    t.ok(parsed.account === "1'", 'account')
    t.ok(parsed.change === 2, 'change')
    t.ok(parsed.index === 3, 'index')
  })

  t.test('mergePath', async function (t) {
    const path = "m/44'/0'/1'/2/3"
    const parsed = HdWallet.parsePath(path)
    const merged = HdWallet.mergePath(parsed)
    t.ok(path === merged, 'merged path works')
  })

  t.test('eachAccount', async function (t) {
    const store = new WalletStoreHyperbee()
    const hd = new HdWallet({ 
      store,
      coinType: "0'",
      purpose: "84'",
    })
    await hd.init({})

    async function tester(expect, name) {
      let count = 0
      await hd.eachAccount(name, async function (syncState, signal) {
        if(count > expect.length ) throw new Error('count exceeded')
        const path = syncState.path
        t.ok(path === expect[count], name+' paths match: ' + expect[count])
        count++
        if(count === expect.length) return signal.stop 
        return signal.hasTx 
      })
      t.ok(count === expect.length, name+' path counter stop signal should work')
    }

    let expect = Array.from({ length: 10 }, (_, idx) => {
      return "m/84'/0'/0'/0/"+idx
    })

    await tester(expect, 'external')
    expect = Array.from({ length: 10 }, (_, idx) => {
      return "m/84'/0'/0'/1/"+idx
    })

    await tester(expect, 'internal')

    async function gapLimitTest(gap, name) {
      t.comment('testing gap limit, with tx at index '+gap + ' for '+name)
      let count = 0
      let prevGapEnd
      await hd.eachAccount(name, async function (syncState, signal) {
        // We skip addr types that we are not testing for 
        if(syncState._addrType !== name) return signal.noTx

        if(count === (gap + 1)) {
          t.ok(syncState.gapEnd >= prevGapEnd, 'gap end increased')
        }

        prevGapEnd = syncState.gapEnd
        if(count > syncState.gapEnd) t.fail('count has gone above gap end')

        // Stop when gap end and count are equal
        if(count === syncState.gapEnd) return signal.stop
        count++

        // transaction is detected
        if(count === gap) return signal.hasTx 
        return signal.noTx
      })
      t.ok(count === prevGapEnd, name+' counter stopped at gap limit '+ (count-1))
    }

    await gapLimitTest(10, 'external')
    await gapLimitTest(20, 'internal')

  })
})
