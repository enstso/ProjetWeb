import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'steps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('goal_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('goals')
        .onDelete('CASCADE')

      table.string('title').notNullable()
      table.date('deadline').nullable()

      table.boolean('is_completed').notNullable().defaultTo(false)
      table.integer('order').notNullable().defaultTo(0)

      table.timestamp('completed_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['goal_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
