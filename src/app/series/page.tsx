import type { Metadata } from "next"
import Link from "next/link"
import { categoryConfigs } from "@/config/categories"

export const metadata: Metadata = {
  title: "Figuras de Anime por Serie",
  description:
    "Explora figuras de anime organizadas por serie: Dragon Ball, One Piece, Naruto, Demon Slayer, Jujutsu Kaisen y muchas más. Encuentra figuras originales de tus series favoritas en Perú. Envío gratis.",
  alternates: {
    canonical: "https://starfigsperu.com/series",
  },
  openGraph: {
    title: "Figuras de Anime por Serie | Starfigs Perú",
    description:
      "Explora figuras de anime organizadas por serie: Dragon Ball, One Piece, Naruto, Demon Slayer y más.",
    url: "https://starfigsperu.com/series",
    siteName: "Starfigs",
    locale: "es_PE",
    type: "website",
  },
}

// Colección única de series desde todas las categorías
const allSeriesList = new Map<string, string[]>() // series name -> categories that include it

categoryConfigs.nendoroid.seriesList.forEach((series) => {
  const existing = allSeriesList.get(series) || []
  existing.push("Nendoroid")
  allSeriesList.set(series, existing)
})
categoryConfigs.figma.seriesList.forEach((series) => {
  const existing = allSeriesList.get(series) || []
  if (!existing.includes("Figma")) existing.push("Figma")
  allSeriesList.set(series, existing)
})

// Usar commonSeries de categories como base
const commonSeries = categoryConfigs.nendoroid.seriesList

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

const seriesGroups = [
  {
    title: "Series más buscadas",
    emoji: "🔥",
    series: ["Dragon Ball", "One Piece", "Naruto", "Demon Slayer", "Kimetsu no Yaiba", "Jujutsu Kaisen", "Attack on Titan", "Chainsaw Man"],
  },
  {
    title: "Clásicos del anime",
    emoji: "🏆",
    series: ["Bleach", "Hunter x Hunter", "Evangelion", "Sailor Moon", "Pokemon", "Digimon", "Cardcaptor Sakura"],
  },
  {
    title: "Nuevas generaciones",
    emoji: "🌟",
    series: ["My Hero Academia", "Boku no Hero Academia", "SPY x FAMILY", "Spy Family", "Tokyo Revengers", "Re:Zero", "Overlord", "Konosuba"],
  },
  {
    title: "Vtubers y música",
    emoji: "🎤",
    series: ["Hololive", "Vtuber", "Vocaloid", "Hatsune Miku", "Love Live", "Idolmaster"],
  },
  {
    title: "Más series",
    emoji: "📚",
    series: commonSeries.filter(
      (s) =>
        !["Dragon Ball", "One Piece", "Naruto", "Demon Slayer", "Kimetsu no Yaiba", "Jujutsu Kaisen", "Attack on Titan", "Chainsaw Man", "Bleach", "Hunter x Hunter", "Evangelion", "Sailor Moon", "Pokemon", "Digimon", "Cardcaptor Sakura", "My Hero Academia", "Boku no Hero Academia", "SPY x FAMILY", "Spy Family", "Tokyo Revengers", "Re:Zero", "Overlord", "Konosuba", "Hololive", "Vtuber", "Vocaloid", "Hatsune Miku", "Love Live", "Idolmaster", "Fate", "Mob Psycho", "Tensei Shitara Slime", "That Time I Got Reincarnated as a Slime", "Gotoubun no Hanayome", "Quintessential Quintuplets"].includes(s),
    ),
  },
]

export default function SeriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Figuras de Anime por Serie
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Encuentra figuras originales de tus series favoritas importadas desde Japón. 
            Cada serie tiene Nendoroid, Figma, escalas, Ichiban Kuji y más.
          </p>
        </div>

        {/* Grupos de series */}
        <div className="space-y-10">
          {seriesGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span>{group.emoji}</span>
                {group.title}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {group.series.map((series) => {
                  const categories = allSeriesList.get(series) || []
                  return (
                    <Link
                      key={series}
                      href={`/series/${slugify(series)}`}
                      className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all"
                    >
                      <span className="text-lg">🎎</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{series}</p>
                        {categories.length > 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {categories.join(", ")}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Serie no encontrada */}
        <div className="mt-12 text-center border-t border-gray-200 dark:border-gray-800 pt-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            ¿No encuentras tu serie?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Escríbenos por WhatsApp y te ayudamos a encontrar la figura que buscas.
          </p>
          <a
            href="https://wa.me/51926951167"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
          >
            💬 Consultar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
