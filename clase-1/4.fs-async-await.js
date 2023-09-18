// Esto sólo en los módulos nativos
// que no tienen promesas nativas

// const { promisify } = require('util');
// const readFilePromise = promisify(fs.readFile);

const { readFile } = require('node:fs/promises');

// IIFE = Immediately Invoked Function Expression
(
  async () => {
    console.log('Leyendo el primer archivo...')

    const text = await readFile('./archivo.txt', 'utf-8')
    console.log('primer texto:', text)

    console.log('Hacer cosas mientras lee el archivo...')

    console.log('Leyendo el segundo archivo...')
    const text2 = await readFile('./archivo2.txt', 'utf-8')
    console.log('segundo texto:', text2)
  }
)()
