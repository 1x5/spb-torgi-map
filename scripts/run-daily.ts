import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function run(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'tsx', script], {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${script} exited with ${code}`))
    })
  })
}

async function main(): Promise<void> {
  await run('scripts/fetch-lots.ts')
  await run('scripts/notify-telegram.ts')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
