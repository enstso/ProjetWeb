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

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.group(() => {
  router.post('/auth/register', [AuthController, 'register'])
  router.post('/auth/login', [AuthController, 'login'])
  router.get('/me', [AuthController,'me']).use(middleware.auth())
});
