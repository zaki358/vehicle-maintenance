import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const scriptsEnvPath = resolve(process.cwd(), 'scripts/.env')

if (existsSync(scriptsEnvPath)) {
  process.loadEnvFile(scriptsEnvPath)
}
