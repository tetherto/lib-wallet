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
'use strict'

const { EventEmitter } = require('events')

/**
 * @desc Base class for WalletPay plugins.
 * Provides methods accessible from the WalletPay class and intercepts events, re-emitting them with a plugin-specific prefix.
 * This class provides a foundation for creating custom plugins that extend the functionality of WalletPay.
 */
class PluginBase extends EventEmitter {
  constructor (opts = {}) {
    super()
    const emit = this.emit
    this.emit = function (type, ...args) {
      emit.apply(this, ['*', `plugin:${opts.name}:${type}`, ...args])
      return emit.apply(this, [type, ...args])
    }

    this.expose = []
  }

  _exposeMethods (arr) {
    this.expose = arr
  }
}

module.exports = PluginBase
