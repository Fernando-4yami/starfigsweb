import { existsSync } from "node:fs"
import { mkdir, readdir, rename, rm, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { load } from "cheerio"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "banners", "hobbysearch")
const OUTPUT_JSON = path.join(
  ROOT_DIR,
  "src",
  "lib",
  "hobbysearch",
  "generated-banner.json",
)
const OUTPUT_JSON_TEMP = `${OUTPUT_JSON}.tmp`

const SOURCE_URL =
  process.env.HOBBYSEARCH_SOURCE_URL || "https://www.1999.co.jp/eng/figure/"
const FEED_URL =
  process.env.STARFIGS_FEED_URL || "https://starfigsperu.com/api/feed"
const SEARCH_INDEX_URL =
  process.env.STARFIGS_SEARCH_INDEX_URL ||
  "https://starfigsperu.com/api/search-index"

const REQUEST_TIMEOUT_MS = 20_000
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const USER_AGENT =
  "StarFigs catalog banner updater/1.0 (+https://starfigsperu.com)"

const TITLE_STOP_WORDS = new Set([
  "bonus",
  "edicion",
  "edition",
  "escala",
  "figure",
  "figura",
  "incluido",
  "included",
  "scale",
  "ver",
  "version",
])

async function fetchResponse(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/json,application/xml,image/*;q=0.9,*/*;q=0.8",
      "User-Agent": USER_AGENT,
    },
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`)
  }

  return response
}

async function fetchText(url) {
  const response = await fetchResponse(url)
  return response.text()
}

function resolveBrowserExecutable() {
  if (process.env.HOBBYSEARCH_BROWSER_EXECUTABLE) {
    return process.env.HOBBYSEARCH_BROWSER_EXECUTABLE
  }

  if (process.platform !== "win32") return undefined

  const candidates = [
    process.env.LOCALAPPDATA &&
      path.join(
        process.env.LOCALAPPDATA,
        "BraveSoftware",
        "Brave-Browser",
        "Application",
        "brave.exe",
      ),
    process.env.PROGRAMFILES &&
      path.join(
        process.env.PROGRAMFILES,
        "Google",
        "Chrome",
        "Application",
        "chrome.exe",
      ),
    process.env["PROGRAMFILES(X86)"] &&
      path.join(
        process.env["PROGRAMFILES(X86)"],
        "Microsoft",
        "Edge",
        "Application",
        "msedge.exe",
      ),
  ].filter(Boolean)

  return candidates.find((candidate) => existsSync(candidate))
}

function createHtmlLoader() {
  let browser = null
  let context = null
  let directRequestsBlocked = false

  async function ensureBrowser() {
    if (browser && context) return

    const { chromium } = await import("playwright")
    browser = await chromium.launch({
      headless: process.env.HOBBYSEARCH_BROWSER_HEADLESS !== "false",
      executablePath: resolveBrowserExecutable(),
    })
    context = await browser.newContext({
      locale: "en-US",
      viewport: { width: 1440, height: 1000 },
    })
  }

  return {
    async get(url) {
      if (!directRequestsBlocked) {
        try {
          return await fetchText(url)
        } catch (error) {
          directRequestsBlocked = true
          console.warn(
            "Direct HobbySearch HTML requests are blocked; using browser for this update.",
          )
        }
      }

      await ensureBrowser()
      const page = await context.newPage()

      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        })
        await page.waitForFunction(
          () =>
            document.title !== "Just a moment..." &&
            !document.body.innerText.includes("Performing security verification"),
          undefined,
          { timeout: 45_000 },
        )
        const pathname = new URL(url).pathname
        if (/^\/eng\/\d+\/?$/.test(pathname)) {
          await page.waitForFunction(
            () => document.body.innerText.includes("JAN code"),
            undefined,
            { timeout: 20_000 },
          )
        } else {
          await page.waitForSelector(
            "#masterBody_headerInfo_slbar .c-mv-carousel__element a",
            { timeout: 20_000 },
          )
        }
        return await page.content()
      } finally {
        await page.close()
      }
    },

    async close() {
      await browser?.close()
      browser = null
      context = null
    },
  }
}

function normalizeDigits(value) {
  const digits = String(value || "").replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 14 ? digits : ""
}

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function getMeaningfulTitleTokens(value) {
  return [
    ...new Set(
      normalizeTitle(value)
        .split(" ")
        .filter(
          (token) =>
            token.length >= 2 &&
            !/^\d+$/.test(token) &&
            !TITLE_STOP_WORDS.has(token),
        ),
    ),
  ]
}

function parseBannerSlides(html) {
  const $ = load(html)
  const slides = new Map()

  $("#masterBody_headerInfo_slbar .c-mv-carousel__element a").each(
    (_, element) => {
      const anchor = $(element)
      const image = anchor.find("img").first()
      const productUrl = new URL(anchor.attr("href") || "", SOURCE_URL)
      const imageUrl = new URL(image.attr("src") || "", SOURCE_URL)
      const productMatch = productUrl.pathname.match(/^\/eng\/(\d+)\/?$/)

      if (
        productUrl.origin !== new URL(SOURCE_URL).origin ||
        !productMatch ||
        imageUrl.origin !== new URL(SOURCE_URL).origin ||
        !imageUrl.pathname.startsWith("/images/slide/")
      ) {
        return
      }

      const sourceId = productMatch[1]
      if (slides.has(sourceId)) return

      slides.set(sourceId, {
        sourceId,
        sourceTitle: (image.attr("alt") || image.attr("title") || "").trim(),
        sourceProductUrl: productUrl.href,
        sourceImageUrl: imageUrl.href,
        width: Number.parseInt(image.attr("width") || "640", 10) || 640,
        height: Number.parseInt(image.attr("height") || "320", 10) || 320,
      })
    },
  )

  const parsedSlides = [...slides.values()]
  if (parsedSlides.length === 0) {
    throw new Error("HobbySearch banner markup returned no valid slides")
  }

  return parsedSlides
}

function parseJanCode(html, productUrl) {
  const $ = load(html)
  const pageText = $("body").text().replace(/\s+/g, " ")
  const match = pageText.match(/JAN\s*code\s*([0-9]{8,14})\b/i)
  const jan = normalizeDigits(match?.[1])

  if (!jan) {
    throw new Error(`JAN code not found for ${productUrl}`)
  }

  return jan
}

function getXmlChildText($, item, tagName) {
  const child = $(item)
    .children()
    .toArray()
    .find((node) => node.type === "tag" && node.name === tagName)
  return child ? $(child).text().trim() : ""
}

function parseProductFeed(xml) {
  const $ = load(xml, { xmlMode: true })
  const products = []

  $("item").each((_, item) => {
    const productUrl = getXmlChildText($, item, "g:link")
    let slug = ""

    try {
      const parsedUrl = new URL(productUrl)
      const match = parsedUrl.pathname.match(/^\/products\/([^/]+)\/?$/)
      if (parsedUrl.origin === "https://starfigsperu.com" && match) {
        slug = decodeURIComponent(match[1])
      }
    } catch {
      return
    }

    if (!slug) return

    products.push({
      name: getXmlChildText($, item, "g:title"),
      slug,
      gtin: normalizeDigits(getXmlChildText($, item, "g:gtin")),
    })
  })

  if (products.length === 0) {
    throw new Error("StarFigs product feed returned no valid products")
  }

  return products
}

function parseSearchIndex(payload) {
  if (!Array.isArray(payload)) {
    throw new Error("StarFigs search index is not an array")
  }

  return payload
    .map((entry) => ({
      name: String(entry?.[1] || "").trim(),
      slug: String(entry?.[2] || "").trim(),
    }))
    .filter((entry) => entry.name && entry.slug)
}

function findProductMatch(slide, feedProducts, searchProducts) {
  const gtinMatch = feedProducts.find((product) => product.gtin === slide.jan)
  if (gtinMatch) {
    return { ...gtinMatch, matchMethod: "gtin" }
  }

  const sourceTokens = getMeaningfulTitleTokens(slide.sourceTitle)
  if (sourceTokens.length < 2) return null

  const titleCandidates = searchProducts.filter((product) => {
    const candidateTokens = new Set(
      normalizeTitle(product.name)
        .split(" ")
        .filter(Boolean),
    )
    return sourceTokens.every((token) => candidateTokens.has(token))
  })

  if (titleCandidates.length !== 1) return null

  const candidate = titleCandidates[0]
  const feedProduct = feedProducts.find(
    (product) => product.slug === candidate.slug,
  )

  if (feedProduct?.gtin && feedProduct.gtin !== slide.jan) return null

  return {
    name: feedProduct?.name || candidate.name,
    slug: candidate.slug,
    gtin: feedProduct?.gtin || "",
    matchMethod: "title-fallback",
  }
}

function getImageExtension(contentType, imageUrl) {
  const normalizedType = String(contentType || "").toLowerCase()
  if (normalizedType.includes("image/png")) return "png"
  if (normalizedType.includes("image/webp")) return "webp"
  if (
    normalizedType.includes("image/jpeg") ||
    normalizedType.includes("image/jpg")
  ) {
    return "jpg"
  }

  const pathname = new URL(imageUrl).pathname.toLowerCase()
  if (pathname.endsWith(".png")) return "png"
  if (pathname.endsWith(".webp")) return "webp"
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "jpg"

  throw new Error(`Unsupported banner image type: ${contentType || pathname}`)
}

async function downloadImage(slide) {
  const response = await fetchResponse(slide.sourceImageUrl)
  const buffer = Buffer.from(await response.arrayBuffer())

  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(
      `Invalid banner image size (${buffer.length} bytes) for ${slide.sourceImageUrl}`,
    )
  }

  getImageExtension(
    response.headers.get("content-type"),
    slide.sourceImageUrl,
  )
  const { default: sharp } = await import("sharp")
  const image = sharp(buffer).rotate()
  const metadata = await image.metadata()
  const standardBuffer = await image
    .clone()
    .resize({
      width: slide.width,
      height: slide.height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toBuffer()

  const variants = [
    {
      buffer: standardBuffer,
      fileName: `${slide.sourceId}.webp`,
      density: 1,
    },
  ]

  if ((metadata.width || 0) > slide.width) {
    const highDensityBuffer = await image
      .clone()
      .resize({
        width: Math.min(slide.width * 2, metadata.width),
        height: Math.min(slide.height * 2, metadata.height || slide.height * 2),
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 6, smartSubsample: true })
      .toBuffer()

    variants.push({
      buffer: highDensityBuffer,
      fileName: `${slide.sourceId}-2x.webp`,
      density: 2,
    })
  }

  return {
    variants,
  }
}

async function updateGeneratedFiles(itemsWithImages) {
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(path.dirname(OUTPUT_JSON), { recursive: true })

  const expectedFiles = new Set()
  const generatedItems = []

  for (const { item, image } of itemsWithImages) {
    for (const variant of image.variants) {
      expectedFiles.add(variant.fileName)
      await writeFile(path.join(OUTPUT_DIR, variant.fileName), variant.buffer)
    }

    const standardVariant = image.variants.find((variant) => variant.density === 1)
    const highDensityVariant = image.variants.find((variant) => variant.density === 2)
    if (!standardVariant) {
      throw new Error(`Missing standard banner image for ${item.sourceId}`)
    }

    generatedItems.push({
      sourceId: item.sourceId,
      jan: item.jan,
      productName: item.productName,
      productSlug: item.productSlug,
      imagePath: `/banners/hobbysearch/${standardVariant.fileName}`,
      ...(highDensityVariant
        ? {
            imagePath2x: `/banners/hobbysearch/${highDensityVariant.fileName}`,
          }
        : {}),
      width: item.width,
      height: item.height,
      matchMethod: item.matchMethod,
    })
  }

  await writeFile(
    OUTPUT_JSON_TEMP,
    `${JSON.stringify({ items: generatedItems }, null, 2)}\n`,
    "utf8",
  )
  await rename(OUTPUT_JSON_TEMP, OUTPUT_JSON)

  for (const fileName of await readdir(OUTPUT_DIR)) {
    if (!expectedFiles.has(fileName)) {
      await unlink(path.join(OUTPUT_DIR, fileName))
    }
  }
}

async function main() {
  const htmlLoader = createHtmlLoader()

  try {
    const bannerHtml = await htmlLoader.get(SOURCE_URL)
    const slides = parseBannerSlides(bannerHtml)

    const slidesWithJan = []
    for (const slide of slides) {
      const productHtml = await htmlLoader.get(slide.sourceProductUrl)
      slidesWithJan.push({
        ...slide,
        jan: parseJanCode(productHtml, slide.sourceProductUrl),
      })
    }

    const [feedXml, searchIndexJson] = await Promise.all([
      fetchText(FEED_URL),
      fetchText(SEARCH_INDEX_URL),
    ])
    const feedProducts = parseProductFeed(feedXml)
    const searchProducts = parseSearchIndex(JSON.parse(searchIndexJson))

    const matchedItems = slidesWithJan.flatMap((slide) => {
      const match = findProductMatch(slide, feedProducts, searchProducts)
      if (!match) return []

      return [
        {
          sourceId: slide.sourceId,
          jan: slide.jan,
          productName: match.name,
          productSlug: match.slug,
          sourceImageUrl: slide.sourceImageUrl,
          width: slide.width,
          height: slide.height,
          matchMethod: match.matchMethod,
        },
      ]
    })

    const itemsWithImages = []
    for (const item of matchedItems) {
      itemsWithImages.push({
        item,
        image: await downloadImage(item),
      })
    }

    await updateGeneratedFiles(itemsWithImages)

    const strictMatches = matchedItems.filter(
      (item) => item.matchMethod === "gtin",
    ).length
    const fallbackMatches = matchedItems.length - strictMatches
    console.log(
      `HobbySearch banner updated: ${slides.length} slides, ${matchedItems.length} matches (${strictMatches} GTIN, ${fallbackMatches} guarded title fallback).`,
    )
  } finally {
    await htmlLoader.close()
  }
}

main().catch(async (error) => {
  await rm(OUTPUT_JSON_TEMP, { force: true }).catch(() => {})
  console.error(error)
  process.exitCode = 1
})
