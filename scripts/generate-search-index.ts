import { config } from "dotenv"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { buildCatalogArtifacts } from "../src/lib/search/index-builder"

config({ path: resolve(process.cwd(), ".env.local") })

async function main() {
  const outputDir = resolve(process.cwd(), "src/lib/search")
  const artifacts = await buildCatalogArtifacts()

  await mkdir(outputDir, { recursive: true })
  await Promise.all([
    writeFile(
      resolve(outputDir, "generated-index.json"),
      JSON.stringify(artifacts.searchIndex),
    ),
    writeFile(
      resolve(outputDir, "generated-feed.json"),
      JSON.stringify(artifacts.feed),
    ),
    writeFile(
      resolve(outputDir, "generated-sitemap.json"),
      JSON.stringify(artifacts.sitemap),
    ),
    writeFile(
      resolve(outputDir, "generated-image-sitemap.json"),
      JSON.stringify(artifacts.imageSitemap),
    ),
    writeFile(
      resolve(outputDir, "generated-admin-options.json"),
      JSON.stringify(artifacts.adminOptions),
    ),
  ])

  console.log(
    `Generated catalog artifacts: ${artifacts.searchIndex.length} search entries, ${artifacts.feed.length} feed items, ${artifacts.adminOptions.brands.length} brands, ${artifacts.adminOptions.lines.length} lines.`,
  )
}

main().catch((error) => {
  console.error("Unable to generate the bundled search index:", error)
  process.exitCode = 1
})
