import { z } from 'zod';

export const verifyScanSchema = z.object({
  body: z.object({
    token: z.string().min(10),
  }),
});


