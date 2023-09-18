// .js -> por defecto utiliza CommonJs
// .mjs -> para utilizar ES Modules
// .cjs -> para utilizar CommonJs

import { sum, mult, sub } from './sum.mjs'

console.log(sum(1,2))
console.log(sub(1,2))
console.log(mult(1,2))