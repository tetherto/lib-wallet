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
const { Socket } = require('bare-ws')

class BareWs extends EventEmitter {
  constructor (url) {
    super()
    this._pingInterval = 25000;
    this._pongTimeout = 32000;
    this._intervalId = null;
    this._pongTimeoutId = null;

    const client = new Socket(url)

    client.on('data', (data) => {
      this.emit('data', data)
    })
    client.on('error', (data) => {
      this.emit('error', data)
    })
    client.on('close', (data) => {
      this.emit('close', data)
    })

    client.on('open', (err) => {
      if (err) return this.emit('error')
      this.emit('open')
      this._startHeartbeat()
    })

    client.on('pong', () => {
      clearTimeout(this._pongTimeoutId)
      this._pongTimeoutId = null
    })

    this._ws = client
  }

  write (data) {
    this._ws.write(data)
  }

  end () {
    this.close()
  }

  close () {
    this._ws.end()
    this._stopHeartbeat()
  }

  _checkAlive () {
    if (this._pongTimeoutId) return // Previous ping hasn't been answered yet

    this._pongTimeoutId = setTimeout(() => {
      this.close()
    }, this._pongTimeout)

    this._ws.ping()
  }

  _startHeartbeat () {
    this._stopHeartbeat()
    this._intervalId = setInterval(() => this._checkAlive(), this._pingInterval)
  }

  _stopHeartbeat () {
    if (this._intervalId) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
    if (this._pongTimeoutId) {
      clearTimeout(this._pongTimeoutId)
      this._pongTimeoutId = null
    }
  }
}

module.exports = BareWs
