'use strict'
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
const assert = require('assert')
const t = require('brittle')
const AssetList = require('../src/lib/asset-list')

t.test('constructor initializes correctly', () => {
  const list = new AssetList()
  assert.strictEqual(list.size, 0)
  assert.deepStrictEqual(list.keys, [])
  assert.strictEqual(Object.keys(list).length, 0) // size and keys should not be enumerable
})

t.test('set method adds assets correctly', () => {
  const list = new AssetList()
  list.set('asset1', 'value1')
  assert.strictEqual(list.size, 1)
  assert.deepStrictEqual(list.keys, ['asset1'])
  assert.strictEqual(list.asset1, 'value1')
})

t.test('set method throws error for duplicate assets', () => {
  const list = new AssetList()
  list.set('asset1', 'value1')
  assert.throws(() => list.set('asset1', 'value2'), {
    name: 'Error',
    message: 'Asset already exists asset1'
  })
})

t.test('exists method works correctly', () => {
  const list = new AssetList()
  list.set('asset1', 'value1')
  assert.strictEqual(list.exists('asset1'), true)
  assert.strictEqual(list.exists('asset2'), false)
})

t.test('iterator works correctly', () => {
  const list = new AssetList()
  list.set('asset1', 'value1')
  list.set('asset2', 'value2')

  const values = []
  for (const value of list) {
    values.push(value)
  }

  assert.deepStrictEqual(values, ['value1', 'value2'])
})

t.test('_define method creates non-enumerable properties', () => {
  const list = new AssetList()
  assert.strictEqual(Object.keys(list).length, 0)
  console.log(list.keys)
  console.log(list.size)
  assert.strictEqual(list.size, 0)
})
