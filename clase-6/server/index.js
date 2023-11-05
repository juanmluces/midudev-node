import express from 'express'
import logger from 'morgan'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import mysql from 'mysql2/promise'
import 'dotenv/config'

const DEFAULT_CONFIG = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}

const config = DEFAULT_CONFIG

const db = await mysql.createConnection(config)

await db.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT,
    user TEXT
  )
`)

const port = process.env.PORT ?? 3000

const app = express()
const server = createServer(app)
const io = new Server(server, {
  connectionStateRecovery: {}
})

io.on('connection', async (socket) => {
  console.log('a user has connected!')

  socket.on('disconnect', () => {
    console.log('a user has disconnected')
  })

  socket.on('chat message', async (msg) => {
    let result
    const username = socket.handshake.auth.username ?? 'anonymous'
    try {
      result = await db.execute(
        'INSERT INTO messages (content, user) Values (?, ?)',
        [msg, username]
      )
    } catch (error) {
      console.error(error)
      return
    }
    io.emit('chat message', msg, result[0].insertId.toString(), username)
  })

  if (!socket.recovered) {
    try {
      const results = await db.execute(
        'SELECT id, content, user FROM messages WHERE id > ?',
        [socket.handshake.auth.serverOffset ?? 0]
      )
      results[0].forEach(msg => {
        socket.emit('chat message', msg.content, msg.id.toString(), msg.user)
      })
    } catch (error) {
      console.error(error)
    }
  }
})

app.use(logger('dev'))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html')
})

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
