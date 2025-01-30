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
const WS = require('./ws-client')

class Provider extends EventEmitter {
  constructor (config) {
    super()

    this.indexerUri = config.indexer
    this.indexerWs = config.indexerWs
    this._subAccounts = []
  }

  async _callServer (method, param, path) {
    const response = await fetch(this.indexerUri + (path || 'jsonrpc'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        param,
        id: (Math.random() * 10e10).toFixed(0)
      })
    })
    return response.json()
  }

  async init () {
    await this._startWs()
  }

  async stop () {
    this._ws?.close()
  }

  async _startWs () {
    return new Promise((resolve, reject) => {
      const ws = new WS(this.indexerWs)
      this._ws = ws
      ws.on('error', err => {
        this.emit('error', err)
        reject(new Error('failed to connected to indexer websocket: ' + err.message))
      })

      ws.on('close', () => this.emit('close'))

      ws.on('data', data => {
        let res
        try {
          res = JSON.parse(data.toString())
        } catch (err) {
          console.log('bad event from server, ignored', err)
          return
        }
        const evname = res?.event
        if (!evname) return console.log('event has no name ignored ', res)
        this.emit(evname, res.error, res.data)
      })
      ws.on('open', resolve)
    })
  }

  async getTransactionsByAddress (query) {
    const data = await this._callServer('getTransactionsByAddress', [query])
    if (data.error) throw new Error(data.error)
    return data.result
  }

  async subscribeToAccount (addr, tokens) {
    this._subAccounts.push([addr, tokens])
    this._ws.write(JSON.stringify({
      method: 'subscribeAccount',
      params: [addr, tokens]
    }))
  }
}

module.exports = Provider
