import { parseServerEnv, type ServerEnv } from './env-schema'

let cached: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
  if (!cached) {
    cached = parseServerEnv(process.env)
  }
  return cached
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, prop: keyof ServerEnv) {
    return getServerEnv()[prop]
  },
})
