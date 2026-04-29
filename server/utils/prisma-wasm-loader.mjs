import { Buffer } from 'node:buffer'
import wasmBase64 from '../../node_modules/.prisma/client/query_compiler_fast_bg.wasm-base64.js'

const { wasm } = wasmBase64
const queryCompilerWasmFileBytes = Buffer.from(wasm, 'base64')

export default Promise.resolve({
  default: new WebAssembly.Module(queryCompilerWasmFileBytes),
})
