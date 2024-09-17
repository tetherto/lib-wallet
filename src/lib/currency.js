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
//

const BN = require('bignumber.js')
const inspect = Symbol.for('nodejs.util.inspect.custom')

BN.config({ EXPONENTIAL_AT: [-20, 40] })

// Currency class
// Base class for currency
class Currency {
  static _BN = BN
  constructor () {
    const { amount, type, config } = this._parseConstArg(...arguments)
    if (type !== 'base' && type !== 'main') throw new Error("Currency type must be either 'base' or 'main'")
    this.amount = amount
    this.config = config
    this.type = type
    this.name = ''
    this.base_name = ''
    this.decimal_places = ''
  }

  _parseConstArg () {
    let param
    const first = arguments[0]
    if (Array.isArray(first)) {
      param = first
    } else if (first instanceof Currency) {
      param = [first.amount, first.type, first.config]
    } else {
      param = arguments
    }
    const amount = BN(param[0]).toString()
    return {
      amount,
      type: param[1],
      config: param[2]
    }
  }

  static BN (num) {
    return new BN(num)
  }

  [inspect] () {
    return `${this.constructor.name} Currency ( ${this.toMainUnit()} ${this.name} - ${this.toBaseUnit()} ${this.base_name} )`
  }

  static toBaseUnit (amount, decimal) {
    return BN(amount).shiftedBy(decimal).toString()
  }

  static toMainUnit (amount, decimal) {
    return BN(amount).shiftedBy(decimal * -1).dp(decimal).toString()
  }

  toString () {
    return this.amount.toString()
  }

  toNumber () {
    return +this.amount
  }

  valueOf () {
    return this.amount
  }

  toJSON () {
    return [
      this.amount,
      this.type,
      this.config
    ]
  }

  isMainUnit () { return this.type === 'main' }

  isBaseUnit () { return this.type === 'base' }

  isSameUnit (currency) {
    return this.type === currency.type
  }

  add (amount) {
    this.isUnitOf(amount)
    const thisBase = this.toBaseUnit()
    const amountBase = amount.toBaseUnit()
    const total = new BN(thisBase).plus(amountBase).toString()
    return new this.constructor(total, 'base', this.config)
  }

  minus (amount) {
    this.isUnitOf(amount)
    const thisBase = this.toBaseUnit()
    const amountBase = amount.toBaseUnit()
    const total = new BN(thisBase).minus(amountBase).toString()
    return new this.constructor(total, 'base', this.config)
  }

  abs () {
    this.amount = Math.abs(this.amount)
    return this
  }

  lte (amount) {
    this.isUnitOf(amount)
    const thisBase = this.toBaseUnit()
    const amountBase = amount.toBaseUnit()
    return new BN(thisBase).lte(amountBase)
  }

  eq (amount) {
    this.isUnitOf(amount)
    const thisBase = this.toBaseUnit()
    const amountBase = amount.toBaseUnit()
    return new BN(thisBase).eq(amountBase)
  }

  gte (amount) {
    this.isUnitOf(amount)
    const thisBase = this.toBaseUnit()
    const amountBase = amount.toBaseUnit()
    return new BN(thisBase).gte(amountBase)
  }

  isUnitOf () {
    throw new Error('method not implemented')
  }
}

module.exports = Currency
