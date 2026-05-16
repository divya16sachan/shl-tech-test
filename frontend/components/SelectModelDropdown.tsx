"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useChatStore } from "@/store/useChatStore"
import { OpenAiIcon, MetaAiIcon } from "./icons/model-icons"

export const AI_MODELS = [
  {
    label: "MetaLlama 3.3 70B",
    value: "llama-3.3-70b-versatile",
    icon: <MetaAiIcon />,
  },
  {
    label: "MetaLlama 3.1 8B",
    value: "llama-3.1-8b-instant",
    icon: <MetaAiIcon />,
  },
  {
    label: "OpenAIGPT OSS 120B",
    value: "openai/gpt-oss-120b",
    icon: <OpenAiIcon />,
  },
  {
    label: "OpenAIGPT OSS 20B",
    value: "openai/gpt-oss-20b",
    icon: <OpenAiIcon />,
  },
  {
    label: "OpenAIWhisper",
    value: "whisper-large-v3",
    icon: <OpenAiIcon />,
  },
  {
    label: "OpenAIWhisper Large V3 Turbo",
    value: "whisper-large-v3-turbo",
    icon: <OpenAiIcon />,
  },
]

export function SelectModelDropdown() {
  const { selectedModel, setSelectedModel } = useChatStore()

  const currentModel = AI_MODELS.find(
    (model) => model.value === selectedModel
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
        >
          {currentModel?.icon}
          <span>{currentModel?.label}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72">
        <DropdownMenuLabel>Select Model</DropdownMenuLabel>

        <DropdownMenuGroup>
          {AI_MODELS.map((model) => (
            <DropdownMenuCheckboxItem
              key={model.value}
              checked={selectedModel === model.value}
              onCheckedChange={() => setSelectedModel(model.value)}
              className="flex flex-col items-start gap-1 py-2"
            >
              <div className="flex items-center gap-2">
                {model.icon}

                <div className="text-sm font-medium">
                  {model.label}
                </div>
              </div>

              <div className="font-mono text-xs text-muted-foreground">
                {model.value}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}