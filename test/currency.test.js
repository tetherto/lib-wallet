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
const Currency = require('../src/lib/currency')

test('constructor', async (t) => {
  const c1 = new Currency(100, 'base', {})
  t.ok(c1.amount === '100', 'Amount should be set correctly')
  t.ok(c1.type === 'base', 'Type should be set correctly')

  const c2 = new Currency([200, 'main', {}])
  t.ok(c2.amount === '200', 'Amount should be set correctly with array input')
  t.ok(c2.type === 'main', 'Type should be set correctly with array input')

  try {
    const c = new Currency(100, 'invalid', {})
    t.ok(false, 'Should throw error for invalid type')
    t.ok(c)
  } catch (err) {
    t.ok(err.message === "Currency type must be either 'base' or 'main'", 'Should throw correct error for invalid type')
  }
})

test('static methods', async (t) => {
  t.ok(Currency.BN(100).toString() === '100', 'BN method should create BigNumber')
  t.ok(Currency.toBaseUnit(1, 2) === '100', 'toBaseUnit should convert correctly')
  t.ok(Currency.toMainUnit(100000000, 8), 'toMainUnit should convert correctly')
})

test('conversion methods', async (t) => {
  const c = new Currency(1000, 'base', {})
  t.ok(c.toString() === '1000', 'toString should return string amount')
  t.ok(c.toNumber() === 1000, 'toNumber should return number amount')
  t.ok(c.valueOf() === '1000', 'valueOf should return string amount')
  t.ok(JSON.stringify(c.toJSON()) === JSON.stringify(['1000', 'base', {}]), 'toJSON should return correct array')
})

test('type checking methods', async (t) => {
  const cMain = new Currency(100, 'main', {})
  const cBase = new Currency(100, 'base', {})
  t.ok(cMain.isMainUnit(), 'isMainUnit should return true for main unit')
  t.ok(cBase.isBaseUnit(), 'isBaseUnit should return true for base unit')
  t.ok(cMain.isSameUnit(cMain), 'isSameUnit should return true for same unit type')
  t.ok(!cMain.isSameUnit(cBase), 'isSameUnit should return false for different unit types')
})

test('arithmetic methods', async (t) => {
  class TestCurrency extends Currency {
    isUnitOf () { return true }
    toBaseUnit () { return this.amount }
  }

  const c1 = new TestCurrency(100, 'base', {})
  const c2 = new TestCurrency(50, 'base', {})

  const sum = c1.add(c2)
  t.ok(sum.amount === '150', 'add should work correctly')

  const diff = c1.minus(c2)
  t.ok(diff.amount === '50', 'minus should work correctly')
})

test('comparison methods', async (t) => {
  class TestCurrency extends Currency {
    isUnitOf () { return true }
    toBaseUnit () { return this.amount }
  }

  const c1 = new TestCurrency(100, 'base', {})
  const c2 = new TestCurrency(50, 'base', {})
  const c3 = new TestCurrency(100, 'base', {})

  t.ok(c1.lte(c1), 'lte should return true for equal amounts')
  t.ok(c2.lte(c1), 'lte should return true for lesser amount')
  t.ok(!c1.lte(c2), 'lte should return false for greater amount')

  t.ok(c1.eq(c3), 'eq should return true for equal amounts')
  t.ok(!c1.eq(c2), 'eq should return false for different amounts')

  t.ok(c1.gte(c1), 'gte should return true for equal amounts')
  t.ok(c1.gte(c2), 'gte should return true for greater amount')
  t.ok(!c2.gte(c1), 'gte should return false for lesser amount')
})


