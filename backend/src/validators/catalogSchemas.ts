import { z } from 'zod';

export const listGamesSchema = z.object({
  query: z.object({
    categoryId: z.string().optional(),
  }),
});

export const listSlotsSchema = z.object({
  query: z.object({
    gameId: z.string().optional(),
    active: z.string().optional(), // "true"
  }),
});

export const listClosuresSchema = z.object({
  query: z.object({
    date: z.string().optional(), // YYYY-MM-DD
  }),
});


