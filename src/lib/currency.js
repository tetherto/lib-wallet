'use strict'

const BN = require('bignumber.js')
const inspect = Symbol.for('nodejs.util.inspect.custom')

BN.config({ EXPONENTIAL_AT: [-20, 40] })

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

  _parseConstArg (args) {
    let param
    if (Array.isArray(arguments[0])) {
      param = arguments[0]
    } else {
      param = arguments
    }
    return {
      amount: param[0],
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

  toMainUnit () {}

  toBaseUnit () {}

  toString () {
    return this.amount
  }

  toJSON () {
    return [
      this.amount,
      this.type,
      this.config
    ]
  }

  valueOf () {
    return this.amount
  }

  isMainUnit () { return this.type === 'main' }

  isBaseUnit () { return this.type === 'base' }

  isSameUnit (currency) {
    return this.type === currency.type
  }

  add () {}
}

module.exports = Currency
