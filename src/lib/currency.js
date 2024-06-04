"use strict";

const BN = require('bignumber.js')
const inspect = Symbol.for('nodejs.util.inspect.custom')

BN.config({ EXPONENTIAL_AT: [-20, 40] })

// Currency is a class that represents a currency
class Currency { 

  static BN = BN
  constructor() {
    const { amount, type, config } = this._parseConstArg(...arguments)
    if(type !== "base" && type !== "main") throw new Error("Currency type must be either 'base' or 'main'")
    this.amount = amount
    this.config = config
    this.type = type
    this.name = ''
    this.base_name = ''
    this.decimal_places = ''
  }

  _parseConstArg(args) {
    let param 
    if(Array.isArray(arguments[0])) {
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

  static BN(num) {
    return new BN(num)
  }

  [inspect]() {
    return `${this.constructor.name} Currency ( ${this.toMainUnit()} ${this.name} - ${this.toBaseUnit()} ${this.base_name} )`
  }

  toMainUnit() {}

  toBaseUnit() {}

  toString() {
    return this.amount
  }

  toJSON() {
    return [
      this.amount,
      this.type,
      this.config
    ]
  }

  valueOf() {
    return this.amount
  }

  isMainUnit() { return this.type === 'main' }

  isBaseUnit() { return this.type === 'base' }

  isSameUnit(currency) {
    return this.type === currency.type
  }

  add() {}

}



class Bitcoin extends Currency {

  constructor(){ 
    super(...arguments)
    const { amount, type, config } = this._parseConstArg(arguments)
    this.name = 'BTC'
    this.base_name = 'SATS'
    this.decimal_places = 8
  }

  toBaseUnit() {
    if(this.type === "base") return this.amount.toString()
    return Bitcoin.toBaseUnit(this.amount, this.decimal_places)
  }

  toMainUnit() {
    if(this.type === "main") return this.amount.toString()
    return Bitcoin.toMainUnit(this.amount, this.decimal_places)
  }

  static toBaseUnit(amount, decimal) {
    return new BN(amount).shiftedBy(decimal).toString()
  }

  static toMainUnit(amount, decimal) {
    return new BN(amount).shiftedBy(decimal * -1).dp(decimal).toString()
  }

  toString() {
    return this.amount.toString()
  }

  toNumber() {
    return +this.amount
  }

  isBitcoin(btc) {
    if(!(btc instanceof Bitcoin)) throw new Error("Amount must be an instance of Bitcoin")
  }

  abs() {
    this.amount = Math.abs(this.amount)
    return this
  }
  
  minus(amount) {
    this.isBitcoin(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    let total = new BN(thisBase).minus(amountBase)
    return new Bitcoin(total, 'base', this.config)
  }

  add(amount) {
    this.isBitcoin(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    let total = new BN(thisBase).plus(amountBase)
    return new Bitcoin(total, 'base', this.config)
  }

  lte(amount) {
    this.isBitcoin(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    return new BN(thisBase).lte(amountBase)
  }

  eq(amount) {
    this.isBitcoin(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    return new BN(thisBase).eq(amountBase)
  }

  gte(amount) {
    this.isBitcoin(amount)
    let thisBase = this.toBaseUnit()
    let amountBase = amount.toBaseUnit()
    return new BN(thisBase).gte(amountBase)
  }

  bn(unit) {
    if(unit === 'base') return new BN(this.toBaseUnit())
    return new BN(this.toMainUnit())
  }
}

module.exports = Currency
