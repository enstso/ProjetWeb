import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'goals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('category').nullable()

      table.enu('priority', ['low', 'medium', 'high']).notNullable().defaultTo('medium')
      table.enu('status', ['active', 'completed', 'abandoned']).notNullable().defaultTo('active')

      table.date('start_date').notNullable()
      table.date('deadline').notNullable()

      table.timestamp('completed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['user_id', 'deadline'])

      // ✅ CHECK en DB (au bon moment)
      table.check('deadline >= start_date', [], 'goals_deadline_after_start')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
