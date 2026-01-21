import vine from '@vinejs/vine'

export const createGoalValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    description: vine.string().trim().optional(),
    category: vine.string().trim().optional(),
    priority: vine.enum(['low', 'medium', 'high']).optional(),
    status: vine.enum(['active', 'completed', 'abandoned']).optional(),
    start_date: vine.string().trim(),  // format YYYY-MM-DD
    deadline: vine.string().trim(),    // format YYYY-MM-DD
  })
)

export const updateGoalValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).optional(),
    description: vine.string().trim().optional(),
    category: vine.string().trim().optional(),
    priority: vine.enum(['low', 'medium', 'high']).optional(),
    status: vine.enum(['active', 'completed', 'abandoned']).optional(),
    start_date: vine.string().trim().optional(),
    deadline: vine.string().trim().optional(),
  })
)
