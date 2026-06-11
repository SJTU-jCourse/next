import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createAnnouncement,
  deleteAnnouncement,
  listAdminAnnouncements,
  listAnnouncements,
  updateAnnouncement,
  type SaveAnnouncementCommand,
} from "@/api/announcement"

export function useAnnouncements(enabled = true) {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: listAnnouncements,
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAdminAnnouncements(enabled = true) {
  return useQuery({
    queryKey: ["announcements", "admin"],
    queryFn: listAdminAnnouncements,
    enabled,
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cmd: SaveAnnouncementCommand) => createAnnouncement(cmd),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["announcements"] })
    },
  })
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cmd }: { id: number; cmd: SaveAnnouncementCommand }) =>
      updateAnnouncement(id, cmd),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["announcements"] })
    },
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAnnouncement(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["announcements"] })
    },
  })
}
