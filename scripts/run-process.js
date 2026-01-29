// Runner wrapper to capture tsx output on Windows
const { execSync } = require('child_process')
const args = process.argv.slice(2).join(' ')
try {
  const result = execSync(`npx tsx scripts/process-manual.ts ${args}`, {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 600000,
    maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
  })
  process.stdout.write(result)
} catch (err) {
  if (err.stdout) process.stdout.write(err.stdout)
  if (err.stderr) process.stderr.write(err.stderr)
  process.exit(err.status || 1)
}
