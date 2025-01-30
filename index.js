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
const Currency = require('./src/lib/currency.js')
const WalletPay = require('./src/lib/wallet-pay.js')
const Wallet = require('./src/lib/wallet.js')
const WalletPayGeneric = require('./src/lib/wallet-pay-generic.js')
const Provider = require('./src/modules/provider.js')
const HdWallet = require('./src/modules/hdwallet.js')
const StateDb = require('./src/modules/state.js')
const TetherCurrency = require('./src/tether-currency.js')
module.exports = {
  Currency,
  Provider,
  WalletPay,
  WalletPayGeneric,
  Wallet,
  HdWallet,
  StateDb,
  TetherCurrency
}
