'use strict'

const test = require('brittle')
const newWallet = require('../src/wallet-lib.js')

test('Load wallet with bitcoin', async function (t) {

  const wallet = await newWallet({
    seed_phrase: 'sell clock better horn digital prevent image toward sort first voyage detail inner regular improve',
  })

  t.end()

})
