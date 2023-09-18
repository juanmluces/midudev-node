const http = require('node:http')

console.log(process.env)
// $env:PORT="1234"
const desiredPort = process.env.PORT ?? 1234

const server = http.createServer((req, res) => {
  console.log('request received')
  res.end('Hola mundo')
})

server.listen(desiredPort, () => {
  console.log(`Server listening on port ${server.address().port}`)
})

