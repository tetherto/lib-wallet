
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
class WebWs extends EventEmitter {
  constructor (url, cb) {
    super()
    const socket = new WebSocket(url)

    socket.addEventListener('message', (event) => {
      this.emit('data', event.data)
    })

    socket.addEventListener('error', (event) => {
      this.emit('error', event)
    })

    socket.addEventListener('close', (event) => {
      this.emit('close', event)
    })
    socket.addEventListener('open', (event) => {
      this.emit('open', event)
    })
    this._ws = socket
  }

  write (data) {
    this._ws.send(data)
  }

  end () {
    this._ws.close()
  }
}

module.exports = WebWs
