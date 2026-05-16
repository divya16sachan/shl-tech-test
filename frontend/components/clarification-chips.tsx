"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface ClarificationChipsProps {
  chips: string[]
  onSelect: (chip: string) => void
  disabled?: boolean
}

export function ClarificationChips({ chips, onSelect, disabled }: ClarificationChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {chips.map((chip, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          onClick={() => onSelect(chip)}
          disabled={disabled}
          className="rounded-full font-medium"
        >
          {chip}
        </Button>
      ))}
    </div>
  )
}
