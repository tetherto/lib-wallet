const ws = require('bare-ws')

const server = new ws.Server({ port: 5555 }, (socket) => {
  socket.on('data', (data) => {
    console.log(data.toString())
  })
})

server.on('listening', () => {
  console.log('listen')

})
