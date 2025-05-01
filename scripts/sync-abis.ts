import { readdir, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Recursively copy every Hardhat-generated contract artifact
 * (…/blockchain/artifacts/contracts/**\/*.json) into `lib/contracts/abis`.
 *
 * • Skips *.dbg.json debug files.
 * • Creates the target directory on first run.
 * • Logs each copied relative path for developer feedback.
 *
 * Run with:  pnpm contracts:copy-abis
 */
async function main(): Promise<void> {
  /* ------------------------------------------------------------------ */
  /*              D E T E R M I N E   P R O J E C T   R O O T           */
  /* ------------------------------------------------------------------ */
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const root = path.resolve(__dirname, '..')

  const artifactsDir = path.join(root, 'blockchain', 'artifacts', 'contracts')
  const targetDir = path.join(root, 'lib', 'contracts', 'abis')

  await mkdir(targetDir, { recursive: true })

  /* ------------------------------------------------------------------ */
  /*                        R E C U R S I V E   C O P Y                 */
  /* ------------------------------------------------------------------ */

  async function traverse(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await traverse(fullPath)
        continue
      }

      if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.endsWith('.dbg.json')) {
        const destPath = path.join(targetDir, entry.name)
        await copyFile(fullPath, destPath)
        console.log(`✔  ${path.relative(root, fullPath)} → ${path.relative(root, destPath)}`)
      }
    }
  }

  try {
    await traverse(artifactsDir)
    console.log('✅  ABI sync complete')
  } catch (err) {
    console.error('❌  ABI sync failed:', (err as Error).message)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  /* Execute only when run directly (not when imported). */
  main()
}
