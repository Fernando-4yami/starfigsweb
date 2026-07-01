import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const nativePackageDirectories = [
  "node_modules/@img/sharp-linux-x64",
  "node_modules/@img/sharp-libvips-linux-x64",
]

const routeTraceFiles = [
  ".next/server/app/api/upload-image/route.js.nft.json",
  ".next/server/app/api/batch-upload/route.js.nft.json",
]

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath]
    }),
  )

  return files.flat()
}

async function main() {
  if (process.platform !== "linux") {
    console.log("Skipping Linux sharp trace patch outside Linux.")
    return
  }

  const packageFiles = (
    await Promise.all(nativePackageDirectories.map(listFiles))
  ).flat()

  if (packageFiles.length === 0) {
    throw new Error("Linux sharp runtime packages are empty.")
  }

  for (const traceFile of routeTraceFiles) {
    const trace = JSON.parse(await readFile(traceFile, "utf8")) as {
      version: number
      files: string[]
    }
    const traceDirectory = path.dirname(traceFile)
    const nativeFiles = packageFiles.map((file) =>
      path.relative(traceDirectory, file).replaceAll("\\", "/"),
    )

    trace.files = [...new Set([...trace.files, ...nativeFiles])]
    await writeFile(traceFile, JSON.stringify(trace))
  }

  console.log(
    `Included ${packageFiles.length} Linux sharp runtime files in ${routeTraceFiles.length} route traces.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
