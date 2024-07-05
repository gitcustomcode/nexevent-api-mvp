import { z } from "nestjs-zod/z";

export const EventQuizFindAllResponse = z.array(
  z.object({
    id: z.string(),
  })
)
