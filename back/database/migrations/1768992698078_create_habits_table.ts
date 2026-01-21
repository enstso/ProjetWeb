import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'habits'

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

      table.string('name').notNullable()
      table.text('description').nullable()
      table.string('category').nullable()

      // AC: daily/weekly + weekly_target
      table.enu('frequency', ['daily', 'weekly']).notNullable().defaultTo('daily')
      table.integer('weekly_target').nullable() // utile seulement si weekly

      table.date('start_date').notNullable()
      table.boolean('is_archived').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['user_id'])
      table.index(['user_id', 'is_archived'])
      table.index(['user_id', 'frequency'])

      // Bonus: contraintes de cohérence (recommandé)
      // weekly_target doit être >= 1 si frequency=weekly
      table.check(
        `(frequency <> 'weekly') OR (weekly_target IS NOT NULL AND weekly_target >= 1)`,
        [],
        'habits_weekly_target_required'
      )

      // pour daily, weekly_target peut être NULL (ou ignoré)
      table.check(
        `(frequency <> 'daily') OR (weekly_target IS NULL OR weekly_target >= 1)`,
        [],
        'habits_daily_weekly_target_ok'
      )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
