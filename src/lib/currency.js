'use strict'

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

  static toBaseUnit(amount, decimal) {
    return BN(amount).shiftedBy(decimal).toString()
  }

  static toMainUnit(amount, decimal) {
    return BN(amount).shiftedBy(decimal * -1).dp(decimal).toString()
  }

  toString() {
    return this.amount.toString()
  }

  toNumber() {
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

  add(amount) {
    this.isUnitOf(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    let total = new BN(thisBase).plus(amountBase)
    return new this.constructor(total, 'base', this.config)
  }

  minus(amount) {
    this.isUnitOf(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    let total = new BN(thisBase).minus(amountBase)
    return new this.constructor(total, 'base', this.config)
  }

  abs() {
    this.amount = Math.abs(this.amount)
    return this
  }

  lte(amount) {
    this.isUnitOf(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    return new BN(thisBase).lte(amountBase)
  }

  eq(amount) {
    this.isUnitOf(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    return new BN(thisBase).eq(amountBase)
  }

  gte(amount) {
    this.isUnitOf(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    return new BN(thisBase).gte(amountBase)
  }
}

module.exports = Currency
