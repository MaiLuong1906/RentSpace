import apiClient from "@/lib/api/axios"
import type { SemanticSearchResult, AssistantSearchResult } from "@/types/search"

export interface ConversationTurn {
  role: string
  content: string
}

export async function semanticSearch(
  query: string,
  history?: ConversationTurn[]
): Promise<SemanticSearchResult> {
  const res = await apiClient.post<{ data: SemanticSearchResult }>("/search/semantic", {
    query,
    history: history && history.length > 0 ? history : undefined,
  })
  return res.data.data
}

export async function assistantSearch(
  query: string,
  history?: ConversationTurn[]
): Promise<AssistantSearchResult> {
  const res = await apiClient.post<{ data: AssistantSearchResult }>("/search/assistant", {
    query,
    history: history && history.length > 0 ? history : undefined,
  })
  return res.data.data
}
