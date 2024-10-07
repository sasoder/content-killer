import { z } from "zod"

export const CommentarySchema = z.object({
  timestamp: z.string(),
  commentary: z.string(),
})

export type Commentary = z.infer<typeof CommentarySchema>

export const CommentaryListSchema = z.object({
  comments: z.array(CommentarySchema),
})

export type CommentaryList = z.infer<typeof CommentaryListSchema>

export const DescriptionSchema = z.object({
  timestamp: z.string(),
  speaker: z.string(),
  description: z.string(),
})

export type Description = z.infer<typeof DescriptionSchema>

export const DescriptionListSchema = z.object({
  descriptions: z.array(DescriptionSchema),
})

export type DescriptionList = z.infer<typeof DescriptionListSchema>
