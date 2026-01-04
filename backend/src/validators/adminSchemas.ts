import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const adminListBookingsSchema = z.object({
  query: z.object({
    date: z.string().optional(),
    status: z.enum(['Confirmed', 'Checked In', 'Cancelled']).optional(),
    gameId: objectIdSchema.optional(),
  }),
});

export const adminUpdateBookingStatusSchema = z.object({
  params: z.object({ bookingId: z.string().min(1) }),
  body: z.object({
    status: z.enum(['Confirmed', 'Checked In', 'Cancelled']),
  }),
});

export const adminDeleteBookingSchema = z.object({
  params: z.object({ bookingId: z.string().min(1) }),
});

export const adminCheckInSchema = z.object({
  params: z.object({ bookingId: z.string().min(1) }),
});

export const adminCreateSlotSchema = z.object({
  body: z.object({
    gameId: objectIdSchema,
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(1).max(24),
    price: z.number().int().min(0),
    active: z.boolean().optional().default(true),
  }),
});

export const adminUpdateSlotSchema = z.object({
  params: z.object({ slotId: z.string().min(1) }),
  body: z.object({
    price: z.number().int().min(0).optional(),
    active: z.boolean().optional(),
  }),
});

export const adminDeleteSlotSchema = z.object({
  params: z.object({ slotId: z.string().min(1) }),
});

export const adminRemoveAllSlotsSchema = z.object({
  query: z.object({
    gameId: objectIdSchema,
  }),
});

export const adminGenerateSlotsSchema = z.object({
  body: z.object({
    gameId: objectIdSchema,
    openHour: z.number().int().min(0).max(23),
    closeHour: z.number().int().min(1).max(24),
    durationMins: z.enum(['60', '120']),
    dayPrice: z.number().int().min(0),
    peakPrice: z.number().int().min(0),
    peakStartHour: z.number().int().min(0).max(23).default(18),
    replaceExisting: z.boolean().optional().default(false),
  }),
});

// -----------------------------
// Admin catalog (Categories / Games)
// -----------------------------

export const adminCreateCategorySchema = z.object({
  body: z
    .object({
      name: z.string().min(2).max(50),
    })
    .strict(),
});

export const adminUpdateCategorySchema = z.object({
  params: z.object({ categoryId: objectIdSchema }),
  body: z
    .object({
      name: z.string().min(2).max(50).optional(),
    })
    .strict(),
});

export const adminDeleteCategorySchema = z.object({
  params: z.object({ categoryId: objectIdSchema }),
});

export const adminCreateGameSchema = z.object({
  body: z
    .object({
      categoryId: objectIdSchema,
      name: z.string().min(2).max(80),
    })
    .strict(),
});

export const adminUpdateGameSchema = z.object({
  params: z.object({ gameId: objectIdSchema }),
  body: z
    .object({
      categoryId: objectIdSchema.optional(),
      name: z.string().min(2).max(80).optional(),
    })
    .strict(),
});

export const adminDeleteGameSchema = z.object({
  params: z.object({ gameId: objectIdSchema }),
});

export const adminCreateClosureSchema = z.object({
  body: z.object({
    type: z.enum(['full', 'partial']),
    date: z.string().min(10).max(10),
    startHour: z.number().int().min(0).max(23).optional(),
    endHour: z.number().int().min(1).max(24).optional(),
    reason: z.string().min(2).max(120),
    note: z.string().max(300).optional(),
  }),
});

export const adminDeleteClosureSchema = z.object({
  params: z.object({ closureId: z.string().min(1) }),
});

export const adminAnalyticsSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});


