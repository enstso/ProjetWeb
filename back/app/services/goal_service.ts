import Goal from '#models/goal'
import {GoalListDto} from "../types/goal_types.js";

export class GoalService {

  /**
   * GET /goals?status=active&priority=high&order=asc|desc
   * AC: lister + filtrer (statut/priorité) + trier deadline
   */
  async list(goalCreate: GoalListDto) {
    const query = Goal.query().where('user_id', goalCreate.user_id);
    if (goalCreate.status) query.where('status', goalCreate.status);
    if (goalCreate.priority) query.where('priority', goalCreate.priority);
    query.orderBy('deadline', goalCreate.order);
    return query;
  }
}
