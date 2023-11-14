## Prerequisites

This starter has minimal prerequisites and most of these will usually already be installed on your computer.

- [Install Node.js](https://nodejs.org/en/download/)
- [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Install Docker](https://docs.docker.com/engine/install/)

## Setting up your store

- Clone project
  ```
  git clone git@gitlab.com:pionero/tng/backend.git
  cd backend
  ```
- Install dependencies
  ```
  npm install
  ```
- Start DB
  ```
  docker-compose -f scripts/docker-compose.db.yml up -d
  ```
- Run your project
  ```
  sh scripts/develop.sh
  ```

Your local Medusa server is now running on port **9000**.

### Seeding your Medusa store

---

To seed your medusa store run the following command:

```
npm run seed
```

This command seeds your database with some sample data to get you started, including a store, an administrator account, a region and a product with variants. What the data looks like precisely you can see in the `./data/seed.json` file.

## Try it out

```
curl -X GET localhost:8080/store/products | python3 -m json.tool
```

After the seed script has run you will have the following things in you database:

- a User with the email: `admin@medusa-test.com` and password: `supersecret`
- a Region called Default Region with the countries `GB`, `DE`, `DK`, `SE`, `FR`, `ES`, `IT`
- a Shipping Option called Standard Shipping which costs `10 EUR`
- a Product called Cool Test Product with 4 Product Variants that all cost `19.50 EUR`

## References

- https://docs.medusajs.com/
- https://adrien2p.github.io/medusa-extender/#/
  - **Generate components**: https://adrien2p.github.io/medusa-extender/#/?id=command-generate-reference
  - **Migrate data**: https://adrien2p.github.io/medusa-extender/#/?id=command-migrate-reference

## Docs Guidelines

- `*.admin.controller.ts` for admin's handlers
- `*.store.controller.ts` for store's handlers
- generate OpenAPI and Typescript SDK
  ```shell
  npm run openapi:generate
  ```

## Server Deploy

- Turnel DB to local

```shell
$ ssh -N -L 54321:tsunaguma-development-aurora.cluster-cl5fwz1j7amk.ap-northeast-1.rds.amazonaws.com:5432 ec2-user@ec2-52-198-114-32.ap-northeast-1.compute.amazonaws.com -i tsunaguma-dev.pem
```

- Change DB `.env`

```js
DATABASE_URL=postgres://root:tsunagumaroot@localhost:54321/tsunaguma
```

- Migrate data

```shell
$ npx medusa migrations run
$ npx medex m -r
```

## Reset DB

```shell
DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA IF NOT EXISTS public
    AUTHORIZATION postgres;
```
