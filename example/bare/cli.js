
/**
* Load bare-js modules
*/
global.process = require('process')
const fetch = require('bare-fetch')
global.fetch = fetch
const { Buffer } = require('bare-buffer')
globalThis.Buffer = Buffer
const TextEncoder =  require('fast-text-encoding')
const fs = require('fs')
const repl = require("repl");

/**
 * Wallet Modules
 */ 
const config = require('./config.json')
const createWallet = require('./node_modules/lib-wallet/src/wallet-lib')

/**
* start cli 
*/ 
require('../node/cli')({
  fs, repl, createWallet, config
})

