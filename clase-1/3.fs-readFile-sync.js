const fs = require('node:fs')

console.log('Leyendo el primer archivo...')

const text1 = fs.readFileSync('./archivo.txt', 'utf-8')
console.log('Primer texto:', text1)

console.log('Hacer cosas mientras lee el archivo...')

console.log('Leyendo el segundo archivo...')
const text2 = fs.readFileSync('./archivo2.txt', 'utf-8')
console.log('Segundo Texto:', text2)
