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

/**
* Load bare-js modules
*/
global.process = require('process')
const fetch = require('bare-fetch')
global.fetch = fetch
const { Buffer } = require('bare-buffer')
globalThis.Buffer = Buffer
const TextEncoder = require('fast-text-encoding')
const fs = require('fs')
const repl = require('repl')
window.TextEncoder = TextEncoder

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
