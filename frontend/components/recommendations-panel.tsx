"use client"

import { useState, useMemo } from "react"
import { useChatStore } from "@/store/useChatStore"
import { RecommendationCard } from "./recommendation-card"
import { IconSearch, IconSparkles, IconX } from "@tabler/icons-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import fuzzysort from "fuzzysort"

export function RecommendationsPanel() {
  const { recommendations, setRecommendationsOpen } = useChatStore()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRecommendations = useMemo(() => {
    const search = searchQuery.trim()

    // Don't search until at least 3 meaningful characters
    if (search.length < 3) {
      return recommendations.map(rec => ({ ...rec, highlight: null }))
    }

    const results = fuzzysort.go(search, recommendations, {
      keys: ["name", "category", "description"],
      threshold: -300,
      limit: 15,

      scoreFn: (a) => {
        const nameScore     = a[0]?.score ?? -Infinity
        const categoryScore = a[1]?.score ?? -Infinity
        const descScore     = a[2]?.score ?? -Infinity

        const boostedName     = nameScore     !== -Infinity ? nameScore + 200 : -Infinity
        const boostedCategory = categoryScore !== -Infinity ? categoryScore + 100 : -Infinity

        return Math.max(boostedName, boostedCategory, descScore)
      },
    })

    return results.map(result => ({
      ...result.obj,
      highlight: {
        name:        result[0]?.highlight("<mark>", "</mark>") ?? result.obj.name,
        category:    result[1]?.highlight("<mark>", "</mark>") ?? result.obj.category,
        description: result[2]?.highlight("<mark>", "</mark>") ?? result.obj.description,
        nameResult:  result[0],
        descriptionResult: result[2],
      },
    }))
  }, [recommendations, searchQuery])

  if (recommendations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 lg:hidden"
          onClick={() => setRecommendationsOpen(false)}
        >
          <IconX size={18} />
        </Button>
        <IconSparkles size={32} className="mb-4 opacity-20" />
        <p className="text-sm">Recommendations will appear here as you chat.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-sidebar shrink-0 px-4 py-2 z-10">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">
              Top Recommendations
              {searchQuery.trim().length >= 3 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {filteredRecommendations.length} of {recommendations.length}
                </span>
              )}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setRecommendationsOpen(false)}
          >
            <IconX size={18} />
          </Button>
        </div>

        <div className="relative">
          <IconSearch className="text-muted-foreground size-4 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder="Search assessments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-6 scrollbar-hide">
        {filteredRecommendations.length > 0 ? (
          filteredRecommendations.map((rec, idx) => (
            <RecommendationCard
              key={idx}
              {...rec}
              searchQuery={searchQuery}
              highlight={rec.highlight}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <IconSearch size={24} className="mb-3 opacity-20" />
            <p className="text-sm">No assessments match <span className="font-medium">"{searchQuery}"</span></p>
            <button
              className="mt-2 text-xs underline underline-offset-2 hover:text-foreground transition-colors"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  )
}