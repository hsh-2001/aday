# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Vercel Deployment

Set these environment variables in Vercel for Production, Preview, and Development:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="use-a-long-random-secret"
```

After adding new Prisma migrations, apply them to the production database:

```bash
npm run prisma:migrate:deploy
```

If the app logs in but does not show entries, check the browser Network tab for `/graphql` errors. The most common cause is that Vercel is using a database where the latest migrations have not been applied.

You can also open this route after deployment:

```bash
https://your-vercel-domain.vercel.app/health
```

Expected response:

```json
{
  "ok": true,
  "database": "connected",
  "hasDatabaseUrl": true
}
```
