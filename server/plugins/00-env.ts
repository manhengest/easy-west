import { parseServerEnv } from '../utils/env-schema'

export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV === 'test') {
    return
  }
  parseServerEnv(process.env)
})
