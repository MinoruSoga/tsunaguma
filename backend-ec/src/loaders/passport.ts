import { AuthService } from '@medusajs/medusa'
import { Express } from 'express'
import { MedusaContainer } from 'medusa-extender'
import { ConfigModule } from 'medusa-extender/dist/modules/multi-tenancy/types'
import passport from 'passport'
import { Strategy as BearerStrategy } from 'passport-http-bearer'
import { ExtractJwt, Strategy as JWTStrategy } from 'passport-jwt'
import { Strategy as LocalStrategy } from 'passport-local'

import UserService from '../modules/user/services/user.service'

export default async ({
  app,
  container,
  configModule,
}: {
  app: Express
  container: MedusaContainer
  configModule: ConfigModule
}): Promise<void> => {
  const authService = container.resolve<AuthService>('authService')
  const userService = container.resolve<UserService>('userService')

  // For good old email password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const { success, user } = await authService.authenticate(
            email,
            password,
          )
          if (success) {
            return done(null, user)
          } else {
            return done('Incorrect Username / Password')
          }
        } catch (error) {
          return done(error)
        }
      },
    ),
  )

  // After a user has authenticated a JWT will be placed on a cookie, all
  // calls will be authenticated based on the JWT
  const { jwt_secret } = configModule.projectConfig as { jwt_secret: string }

  passport.use(
    'jwt',
    new JWTStrategy(
      {
        jwtFromRequest: (req) => {
          return ExtractJwt.fromAuthHeaderAsBearerToken()(req) // || req.session?.jwt
        },
        secretOrKey: jwt_secret,
      },
      async (jwtPayload, done) => {
        const userId = jwtPayload.id || jwtPayload.user_id
        userService
          .retrieve(userId, { select: ['id', 'type', 'store_id', 'status'] })
          .then((user) => {
            jwtPayload.data = user

            return done(null, jwtPayload)
          })
          .catch((error) => {
            return done(null, false)
          })
      },
    ),
  )

  // Alternatively use bearer token to authenticate to the admin api
  passport.use(
    new BearerStrategy(async (token, done) => {
      const auth = await authService.authenticateAPIToken(token)
      if (auth.success) {
        done(null, auth.user)
      } else {
        done(auth.error)
      }
    }),
  )

  app.use(passport.initialize())
  // app.use(passport.session())
}
