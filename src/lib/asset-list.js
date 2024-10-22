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

// Simple data structure for iterating assets
class AssetList {
  constructor () {
    this._define('size', 0)
    this._define('keys', [])
  }

  _define (k, v) {
    Object.defineProperty(this, k, {
      value: v,
      writable: true,
      configurable: true,
      enumerable: false
    })
  }

  set (k, v) {
    if (this.exists(k)) throw new Error('Asset already exists ' + k)
    this.size++
    this[k] = v
    this.keys.push(k)
    return v
  }

  async each (fn) {
    const data = Object.keys(this)
    return Promise.all(data.map((k) => {
      return fn(this[k])
    }))
  }

  async forEach(fn) {
    for (const asset of this) {
      await fn(asset)
    }
  }

  exists (k) {
    return !!this[k]
  }

  [Symbol.iterator] () {
    let index = 0
    const items = this.keys
    return {
      next: () => {
        if (index < items.length) {
          return { value: this[items[index++]], done: false }
        } else {
          return { done: true }
        }
      }
    }
  }
}

module.exports = AssetList
