import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'habit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('habit_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('habits')
        .onDelete('CASCADE')

      // AC: (habit_id, date) unique
      table.date('date').notNullable()

      table.boolean('is_completed').notNullable().defaultTo(true)
      table.text('notes').nullable()

      table.timestamp('created_at', { useTz: true })

      table.unique(['habit_id', 'date'], { indexName: 'habit_logs_habit_id_date_unique' })
      table.index(['habit_id'])
      table.index(['date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
