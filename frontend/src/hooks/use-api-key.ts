import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createApiKey,
  createSystemApiKey,
  deleteApiKey,
  deleteSystemApiKey,
  listApiKeys,
  listSystemApiKeys,
  type CreateApiKeyCommand,
} from "@/api/api-key"

export function useApiKeys(enabled = true) {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: listApiKeys,
    enabled,
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cmd: CreateApiKeyCommand) => createApiKey(cmd),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["api-keys"] })
    },
  })
}

export function useDeleteApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteApiKey(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["api-keys"] })
    },
  })
}

export function useSystemApiKeys(enabled = true) {
  return useQuery({
    queryKey: ["api-keys", "system"],
    queryFn: listSystemApiKeys,
    enabled,
  })
}

export function useCreateSystemApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cmd: CreateApiKeyCommand) => createSystemApiKey(cmd),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["api-keys", "system"] })
    },
  })
}

export function useDeleteSystemApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSystemApiKey(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["api-keys", "system"] })
    },
  })
}
