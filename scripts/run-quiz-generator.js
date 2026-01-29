// Runner wrapper to execute quiz question generator on Windows
const { execSync } = require('child_process')
const args = process.argv.slice(2).join(' ')

try {
  const result = execSync(`npx tsx scripts/generate-quiz-questions.ts ${args}`, {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 600000, // 10 minutos
    maxBuffer: 50 * 1024 * 1024, // 50MB
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
  })
  process.stdout.write(result)
} catch (err) {
  if (err.stdout) process.stdout.write(err.stdout)
  if (err.stderr) process.stderr.write(err.stderr)
  process.exit(err.status || 1)
}
