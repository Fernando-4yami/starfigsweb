import { config } from "dotenv"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { buildSearchIndex } from "../src/lib/search/index-builder"

config({ path: resolve(process.cwd(), ".env.local") })

async function main() {
  const outputPath = resolve(
    process.cwd(),
    "src/lib/search/generated-index.json",
  )
  const index = await buildSearchIndex()

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(index))
  console.log(`Generated search index with ${index.length} products.`)
}

main().catch((error) => {
  console.error("Unable to generate the bundled search index:", error)
  process.exitCode = 1
})
