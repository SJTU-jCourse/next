import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  createReview,
  deleteReview,
  getReview,
  listReviewRevisions,
  listFollowedReviews,
  listReviews,
  listUserReviews,
  updateReview,
  updateReviewModeratorRemark,
  voteReview,
  type CreateReviewCommand,
  type ReviewListFilter,
  type UpdateReviewModeratorRemarkCommand,
  type UpdateReviewCommand,
  type VoteType,
} from "@/api/review"

export function useReviews(filter: ReviewListFilter = {}) {
  return useQuery({
    queryKey: ["reviews", "list", filter],
    queryFn: () => listReviews(filter),
    placeholderData: keepPreviousData,
  })
}

export function useFollowedReviews(filter: ReviewListFilter = {}) {
  return useQuery({
    queryKey: ["reviews", "followed", filter],
    queryFn: () => listFollowedReviews(filter),
    placeholderData: keepPreviousData,
  })
}

export function useUserReviews(userID: number, filter: ReviewListFilter = {}) {
  return useQuery({
    queryKey: ["reviews", "user", userID, filter],
    queryFn: () => listUserReviews(userID, filter),
    enabled: !!userID,
    placeholderData: keepPreviousData,
  })
}

export function useReview(reviewID: number) {
  return useQuery({
    queryKey: ["review", reviewID],
    queryFn: () => getReview(reviewID),
    enabled: !!reviewID,
  })
}

export function useReviewRevisions(reviewID: number, enabled = true) {
  return useQuery({
    queryKey: ["review", reviewID, "revisions"],
    queryFn: () => listReviewRevisions(reviewID),
    enabled: !!reviewID && enabled,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cmd: CreateReviewCommand) => createReview(cmd),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] })
      void queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      reviewID,
      cmd,
    }: {
      reviewID: number
      cmd: UpdateReviewCommand
    }) => updateReview(reviewID, cmd),
    onSuccess: (_, { reviewID }) => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] })
      void queryClient.invalidateQueries({ queryKey: ["review", reviewID] })
    },
  })
}

export function useUpdateReviewModeratorRemark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      reviewID,
      cmd,
    }: {
      reviewID: number
      cmd: UpdateReviewModeratorRemarkCommand
    }) => updateReviewModeratorRemark(reviewID, cmd),
    onSuccess: (_, { reviewID }) => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] })
      void queryClient.invalidateQueries({ queryKey: ["review", reviewID] })
    },
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reviewID: number) => deleteReview(reviewID),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] })
      void queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

export function useVoteReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      reviewID,
      voteType,
    }: {
      reviewID: number
      voteType: VoteType
    }) => voteReview(reviewID, voteType),
    onMutate: async ({ reviewID, voteType }) => {
      await queryClient.cancelQueries({ queryKey: ["review", reviewID] })
      const prev = queryClient.getQueryData(["review", reviewID])
      queryClient.setQueryData(["review", reviewID], (old: unknown) => {
        if (!old || typeof old !== "object") return old
        const o = old as {
          vote?: { like_count: number; dislike_count: number; my_vote?: number }
        }
        return {
          ...o,
          vote: {
            ...o.vote,
            my_vote: voteType,
          },
        }
      })
      return { prev }
    },
    onError: (_err, { reviewID }, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["review", reviewID], context.prev)
      }
    },
    onSettled: (_data, _err, { reviewID }) => {
      void queryClient.invalidateQueries({ queryKey: ["review", reviewID] })
      void queryClient.invalidateQueries({ queryKey: ["reviews"] })
      void queryClient.invalidateQueries({ queryKey: ["course-reviews"] })
    },
  })
}
