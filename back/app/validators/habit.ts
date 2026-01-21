import vine from '@vinejs/vine'

export const createHabitValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    description: vine.string().trim().optional(),
    category: vine.string().trim().optional(),
    frequency: vine.enum(['daily', 'weekly']),
    weekly_target: vine.number().min(1).optional(), // requis si weekly (check controller)
    start_date: vine.string().trim(), // YYYY-MM-DD
  })
)

export const updateHabitValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).optional(),
    description: vine.string().trim().optional(),
    category: vine.string().trim().optional(),
    frequency: vine.enum(['daily', 'weekly']).optional(),
    weekly_target: vine.number().min(1).optional(),
    start_date: vine.string().trim().optional(),
  })
)
