/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import {middleware} from "#start/kernel";
import AuthController from "#controllers/auth_controller";
import UsersController from "#controllers/users_controller";
import GoalsController from "#controllers/goals_controller";
import StepsController from "#controllers/steps_controller";

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.group(() => {
  router.post('/auth/register', [AuthController, 'register'])
  router.post('/auth/login', [AuthController, 'login'])
  router.get('/me', [AuthController,'me']).use(middleware.auth())
  router.put('/me',[UsersController,'updateMe']).use(middleware.auth())
});

router.group(()=>{
  router.get('/goals',[GoalsController,'index']).use(middleware.auth())
  router.post('/goals',[GoalsController,'store']).use(middleware.auth())
  router.get('/goals/:id',[GoalsController,'show']).use(middleware.auth())
  router.put('/goals/:id',[GoalsController,'update']).use(middleware.auth())
  router.delete('/goals/:id',[GoalsController,'destroy']).use(middleware.auth())
  router.patch('/goals/:id/complete',[GoalsController,'complete']).use(middleware.auth())
});

router.group(() => {
  router.get('/goals/:id/steps',[StepsController,'index'] ).use(middleware.auth())
  router.post('/goals/:id/steps', [StepsController,'store']).use(middleware.auth())
  router.put('/steps/:id', [StepsController,'update']).use(middleware.auth())
  router.delete('/steps/:id',[StepsController,'destroy'] ).use(middleware.auth())
  router.patch('/steps/:id/complete',[StepsController,'complete'] ).use(middleware.auth())
  router.get('/goals/:id/progress',[GoalsController,'progress']).use(middleware.auth());
})
