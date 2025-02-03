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
const PluginBase = require('./plugin-base')

class ConnectionStatus {
  static STATUS = {
    DISCONNECTED: 0,
    CONNECTING: 1,
    CONNECTED: 2,
    DISCONNECTING: 3,
    ERROR: 4,
    DESTROYED: 5
  }

  static #frozen = false

  static initialize () {
    if (this.#frozen) return
    Object.freeze(this.STATUS)
    this.#frozen = true
  }

  static toString (status) {
    return Object.keys(this.STATUS).find(key =>
      this.STATUS[key] === status
    ) || 'UNKNOWN'
  }

  static isValid (status) {
    return Object.values(this.STATUS).includes(status)
  }

  static getStatusChangeEvent (oldStatus, newStatus) {
    return {
      prevStatus: {
        code: oldStatus,
        string: this.toString(oldStatus)
      },
      newStatus: {
        code: newStatus,
        string: this.toString(newStatus)
      },
      timestamp: Date.now()
    }
  }
}

// Initialize and freeze the status enum
ConnectionStatus.initialize()

const STATUS = ConnectionStatus.STATUS

class ConnectionManager extends PluginBase {
  static ConnectionStatus = ConnectionStatus

  constructor (opts = {}) {
    opts.name = opts.name || 'connection'
    super(opts)
    this.status = ConnectionStatus.STATUS.DISCONNECTED

    this.maxReconnectAttempts = opts.maxReconnectAttempts || 1000
    this.initialReconnectDelay = opts.initialReconnectDelay || 2000
    this.maxReconnectDelay = opts.maxReconnectDelay || 30000

    this._reconnectAttempts = 0
    this._reconnectTimer = null
    this._currentReconnectDelay = this.initialReconnectDelay

    this._exposeMethods([
      'isConnected',
      'connect',
      'reconnect',
      'getConnectionStatus'
    ])
  }

  _setEndpoint(data) {
    this._endpoints = data
  }

  getEndpoint() {
    return this._endpoints
  }

  getConnectionStatus () {
    return {
      code: this.status,
      msg: this.getStatusString()
    }
  }

  getStatus () {
    return this.status
  }

  isConnected () {
    return this.getStatus() === STATUS.CONNECTED
  }

  getStatusString () {
    return ConnectionStatus.toString(this.status)
  }

  setStatus (newStatus) {
    if (this.status === STATUS.DESTROYED) return
    if (!ConnectionStatus.isValid(newStatus)) {
      throw new Error(`Invalid connection status: ${newStatus}`)
    }

    const oldStatus = this.status
    this.status = newStatus

    if (oldStatus === newStatus) return

    this.emit('status',
      ConnectionStatus.getStatusChangeEvent(oldStatus, newStatus)
    )

    if (newStatus === STATUS.CONNECTING ||
        newStatus === STATUS.DESTROYED
    ) return

    if (newStatus === STATUS.CONNECTED) {
      return this._resetReconnectionState()
    }
    this._handleDisconnection()
  }

  async connect () {
    throw new Error('method not implemented')
  }

  async reconnect () {
    throw new Error('method not implemented')
  }

  destroy () {
    this.setStatus(ConnectionStatus.STATUS.DESTROYED)
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
      this._reconnectTimer = null
    }
    this.removeAllListeners()
  }

  _handleDisconnection () {
    if (this._reconnectAttempts < this.maxReconnectAttempts) {
      this._scheduleReconnection()
    } else {
      this.emit('timeout', {
        attempts: this._reconnectAttempts,
        timestamp: Date.now()
      })
    }
  }

  _scheduleReconnection () {
    // Clear any existing reconnection timer
    if (this.status === ConnectionStatus.STATUS.DESTROYED) return
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
    }

    // Calculate delay with exponential backoff
    this._currentReconnectDelay = Math.min(
      this.initialReconnectDelay * Math.pow(2, this._reconnectAttempts),
      this.maxReconnectDelay
    )

    this._reconnectTimer = setTimeout(async () => {
      if (this.status === ConnectionStatus.STATUS.DESTROYED) return
      this._reconnectAttempts++
      this.emit('reconnecting', {
        attempt: this._reconnectAttempts,
        delay: this._currentReconnectDelay,
        timestamp: Date.now()
      })

      this.setStatus(ConnectionStatus.STATUS.CONNECTING)

      try {
        await this.connect()
      } catch {
        return this.setStatus(ConnectionStatus.STATUS.ERROR)
      }

      this.setStatus(ConnectionStatus.STATUS.CONNECTED)
    }, this._currentReconnectDelay)
  }

  _resetReconnectionState () {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
    }
    this._reconnectAttempts = 0
    this._currentReconnectDelay = this.initialReconnectDelay
  }

  async retryable(operation, config = {}) {
    const defaultRetryConfig = {
      maxRetries: 3,
      baseDelay: 3000,
      backoffFactor: 2
    }

    const retryConfig = { ...defaultRetryConfig, ...config }
    const { maxRetries, baseDelay, backoffFactor } = retryConfig

    async function attempt(retries) {
      try {
        return await operation()
      } catch (error) {
        if (retries === 0) {
          const retryError = new Error(`Failed after ${maxRetries} retries: ${error.message}`)
          retryError.cause = error
          throw retryError
        }

        const delay = baseDelay * Math.pow(backoffFactor, maxRetries - retries)
        console.log(`Retry attempt ${maxRetries - retries + 1}. Retrying in ${delay}ms`)

        await new Promise(resolve => setTimeout(resolve, delay))
        return attempt(retries - 1)
      }
    }

    return attempt(maxRetries)
  }


}

module.exports = ConnectionManager
