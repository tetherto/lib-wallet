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

const { EventEmitter } = require('events')
const tls = require('tls')

/** @description TCP <> TLS adaptor **/
class Client extends EventEmitter {
  constructor (port, host, options, cb) {
    super()
    const socket = tls.connect(port, host, {
      handshakeTimeout: 10000,
      rejectUnauthorized: false
    }, () => {
      if (cb) cb()
    })

    socket.on('error', (err) => {
      console.log(err)
      this.emit('error', err)
    })

    socket.on('close', () => {
      this.emit('end')
    })

    socket.on('data', (data) => {
      this.emit('data', data)
    })

    this._socket = socket
  }

  write (data) {
    this._socket.write(data)
  }

  end () {
    this._socket.end()
  }
}

class TlsNet {
  static createConnection (port, host, options = {}, cb) {
    if (typeof options === 'function') {
      cb = options
      options = {}
    }
    return new Client(port, host, options, cb)
  }
}

module.exports = TlsNet
