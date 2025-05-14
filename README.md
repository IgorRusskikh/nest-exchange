<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed a recent LTS version of [Node.js](https://nodejs.org/) (e.g., 18.x or 20.x).
- You have installed [Yarn](https://yarnpkg.com/) package manager.
- You have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed (recommended for managing services like Redis and PostgreSQL).
- You have [OpenSSL](https://www.openssl.org/) installed (for generating JWT keys).

## Getting Started

Follow these steps to get your development environment set up:

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd nest-exchange
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure Environment Variables

This project uses environment variables for configuration. You'll need to create a `.env` file in the root of the project. You can copy `.env.example` if it exists, or create a new one.

Fill it with the necessary values. Key variables include:

- **Application & Server:**

  - `PORT=3000` (Port the application will run on)
  - `CORS_ORIGIN=http://localhost:3001` (URL of your frontend application)
  - `NODE_ENV=development`

- **Database (PostgreSQL via Prisma):**

  - `DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"` (Replace with your actual database connection string)

- **Redis:**

  - `REDIS_URL="redis://localhost:6379"` (For NestJS caching, session storage, etc.)
  - `RL_REDIS_HOST=localhost` (For Rate Limiter Redis instance)
  - `RL_REDIS_PORT=6379` (For Rate Limiter Redis instance)

- **JWT Authentication:**

  - `JWT_PRIVATE_KEY_PATH=./keys/private.key` (Path to your JWT private key)
  - `JWT_PUBLIC_KEY_PATH=./keys/public.key` (Path to your JWT public key)
  - `JWT_DEFAULT_TOKEN_EXPIRES_IN=15m` (Access token expiration)
  - `JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS=604800` (Refresh token expiration, e.g., 7 days)
  - `JWT_ALGORITHM=RS256`

- **Blockchain Interaction:**

  - `INFURA_RPC_URL=` (Your RPC URL for connecting to the Ethereum network, e.g., from Infura or Alchemy)
  - `AUTH_DOMAIN=yourapp.com` (Domain used in SIWE messages)
  - `NONCE_EXPIRATION_SECONDS=300` (Expiration for authentication nonces)

- **Rate Limiter:**
  - `RL_KEY_PREFIX=rate-limit`
  - `RL_POINTS=100` (Max requests)
  - `RL_DURATION=60` (Per 60 seconds)
  - `RL_BLOCK_DURATION=600` (Block for 600 seconds if limit exceeded)

### 4. Generate JWT Keys

The application uses RSA keys for signing JWTs. You need to generate a private and public key pair.

Create a `keys` directory in the project root if it doesn't exist:

```bash
mkdir keys
```

Generate the private key:

```bash
openssl genpkey -algorithm RSA -out ./keys/private.key -pkeyopt rsa_keygen_bits:2048
```

Generate the public key from the private key:

```bash
openssl rsa -pubout -in ./keys/private.key -out ./keys/public.key
```

Ensure the paths in your `.env` file for `JWT_PRIVATE_KEY_PATH` and `JWT_PUBLIC_KEY_PATH` match where you've saved these keys.

### 5. Set Up the Database (Prisma)

Once your `DATABASE_URL` is configured in the `.env` file and your PostgreSQL server is running (either locally or via Docker), run Prisma migrations to set up the database schema:

```bash
yarn prisma migrate dev
```

This command will also generate the Prisma Client.

### 6. Running Services with Docker Compose (Optional but Recommended)

The project includes a `docker-compose.yml` file to easily run dependent services like PostgreSQL and Redis.

To start these services:

```bash
docker-compose up -d
```

This will start PostgreSQL and Redis in detached mode. Make sure your `DATABASE_URL` and Redis URLs in the `.env` file match the credentials and ports defined in `docker-compose.yml`.

## Running the Application

Once the setup is complete, you can run the application:

### Development Mode

For development with auto-reload on file changes:

```bash
yarn run start:dev
```

The application will be available at `http://localhost:PORT` (e.g., `http://localhost:3000` if `PORT=3000`).

### Production Mode

To build and run the application for production:

```bash
# 1. Build the application
yarn run build

# 2. Start the application
yarn run start:prod
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
