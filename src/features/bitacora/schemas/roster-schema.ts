import { z } from 'zod'

export const activityTypeSchema = z.enum([
  'flight',
  'sim',
  'ground',
  'standby',
  'off',
  'vacation',
  'training',
  'medical',
  'other',
])

export const rosterFlightSchema = z.object({
  flight_number: z.string().nullable(),
  aircraft_type: z.string().nullable(),
  aircraft_registration: z.string().nullable(),
  origin: z.string().length(3), // IATA code
  destination: z.string().length(3), // IATA code
  std: z.string().regex(/^\d{2}:\d{2}$/).nullable(), // HH:MM format
  sta: z.string().regex(/^\d{2}:\d{2}$/).nullable(), // HH:MM format
  block_hours: z.number().min(0).max(24).nullable(),
  is_night: z.boolean(),
})

export const rosterEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  activity_type: activityTypeSchema,
  check_in: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  check_out: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  hotel: z.string().nullable(),
  notes: z.string().nullable(),
  crew_captain: z.string().nullable(),
  crew_first_officer: z.string().nullable(),
  crew_purser: z.string().nullable(),
  flights: z.array(rosterFlightSchema),
})

export const rosterResponseSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  entries: z.array(rosterEntrySchema),
})

export const manualLogbookFlightSchema = z.object({
  flight_number: z.string().optional(),
  aircraft_type: z.string().optional(),
  aircraft_registration: z.string().optional(),
  origin: z.string().length(3),
  destination: z.string().length(3),
  std: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  sta: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  block_off: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  block_on: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  block_hours: z.number().min(0).max(24).optional(),
  flight_hours: z.number().min(0).max(24).optional(),
  is_pf: z.boolean().optional(),
  is_night: z.boolean().optional(),
  is_cat_ii_iii: z.boolean().optional(),
  approach_type: z.string().optional(),
  remarks: z.string().optional(),
})

export const manualLogbookEntrySchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activity_type: activityTypeSchema,
  check_in: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  check_out: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  hotel: z.string().optional(),
  notes: z.string().optional(),
  crew_captain: z.string().optional(),
  crew_first_officer: z.string().optional(),
  crew_purser: z.string().optional(),
  flights: z.array(manualLogbookFlightSchema).optional(),
})

export type RosterFlight = z.infer<typeof rosterFlightSchema>
export type RosterEntry = z.infer<typeof rosterEntrySchema>
export type RosterResponse = z.infer<typeof rosterResponseSchema>
export type ManualLogbookFlight = z.infer<typeof manualLogbookFlightSchema>
export type ManualLogbookEntry = z.infer<typeof manualLogbookEntrySchema>
