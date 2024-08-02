
const { EventEmitter }  = require('events');
const  WebSocket = require('websocket').w3cwebsocket

class Client  extends EventEmitter {
  constructor(port, host, cb) {
    super()
    const ws = new WebSocket(`${host}:${port}`)
    ws.onerror = (err) => {
      this.emit('error', err)
    }

    ws.onclose = (err) => {
      this.emit('end', err)
    }

    ws.onopen = () => {
      cb()
    }

    ws.onmessage = (data) => {
      this.emit('data',data.data)
    }

    this._ws = ws
  }


  write(data) {
    this._ws.send(data)
  }

  end() {
    this._ws.close()
  }
}


class WebsocketNet {

  static createConnection(port, host, cb) {
      return new Client (port, host,cb);
  }
}

module.exports = WebsocketNet
