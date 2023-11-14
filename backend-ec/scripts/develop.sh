#!/bin/bash

npm i

#Run migrations to ensure the database is updated
npx medusa migrations run

npx medex m -r

#Start development environment
# DEBUG=* npm run start:watch
npm run start:watch