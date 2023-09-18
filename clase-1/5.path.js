const path = require('node:path')

// barra separadora de carpetas según OS
console.log(path.sep)

// unir rutas con path.join
const filePath = path.join('content', 'subfolder', 'test.txt')
console.log(filePath)

const base = path.basename('/temp/midu-secret-files/password.txt')
console.log(base)

const filename = path.basename('/temp/midu-secret-files/password.txt', '.txt')
console.log(filename)

const extension = path.extname('image.jpg')
console.log(extension)
