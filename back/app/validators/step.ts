import vine from '@vinejs/vine'

export const createStepValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    deadline: vine.string().trim().optional(), // YYYY-MM-DD
    order: vine.number().optional(),
  })
)

export const updateStepValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).optional(),
    deadline: vine.string().trim().optional(),
    order: vine.number().optional(),
    is_completed: vine.boolean().optional(), // pas nécessaire mais utile
  })
)
