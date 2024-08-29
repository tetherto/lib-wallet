global.process = require('process')

WS = require('websocket').w3cwebsocket;
zz = new WS('ws://127.0.0.1:8181/') ; 
zz.onerror = function(a) { console.log('fail') } ;
zz.onclose = (a) =>{
}
zz.onopen = function() { console.log(123123) }

//const ws = require('bare-ws')
//  const socket = new ws.Socket({ port: 8181, host: '127.0.0.1' })
//  socket.on('data', (data) => {
//    console.log(data.toString())
//  })
//
//
//  socket.write('Hello WebSocket')
