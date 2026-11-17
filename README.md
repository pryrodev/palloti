# Pallotti Holy Family Province website

Next.js site and CMS for the Holy Family Province. CMS content is stored in MySQL through Prisma. Media uploads and selection use the Cloudinary Upload Widget; Cloudinary credentials stay on the server except the public cloud name and API key required by the widget.

## Local CMS setup

Requirements: Node.js 20+, npm, and Docker Desktop.

1. Copy `.env.example` to `.env` and set `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and the Cloudinary values from your Cloudinary console.
2. Start MySQL: `docker compose up -d db`
3. Install dependencies: `npm install`
4. Generate Prisma Client and apply the schema: `npm run db:generate` then `npm run db:deploy`
5. Import the committed JSON and dictionary content once: `npm run db:seed`
6. Start the site: `npm run dev`

The seed uses create-only behavior: running it again will not replace CMS content already in MySQL. To reload the original JSON into an existing database, export/backup the database first and explicitly clear the target CMS collections.

## Environment values

- `DATABASE_URL`: MySQL connection string. Local default is `mysql://pallotti:local-app-password@127.0.0.1:33306/pallotti_cms`.
- `ADMIN_PASSWORD`: CMS login password. There is no built-in default.
- `ADMIN_SESSION_SECRET`: long random secret used to sign the HTTP-only admin session cookie.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: server side Cloudinary configuration.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`: public widget configuration; never put the API secret here.

For Vercel, configure these in the project environment settings and point `DATABASE_URL` at a managed MySQL service that supports connections from serverless functions. Run `npm run db:deploy` against that database during release, then run `npm run db:seed` once to import the existing content. Do not expose a development database directly to the public internet.

## CMS data model

`cms_collections` stores the six existing content sets (`news`, `communities`, `direction`, `gallery`, `videos`, and `publications`) as validated JSON documents with a revision and update timestamp. This keeps the current bilingual shapes while removing runtime filesystem writes. `media_assets` stores Cloudinary uploads and inventories the existing local images, videos, and PDFs so the media picker starts populated. New uploads go to Cloudinary. Every collection update is validated with Zod before Prisma writes it. Public pages load CMS managed collections dynamically; checked-in JSON remains a local fallback until the DB has been initialized.

The admin uses TanStack Query hooks for cached collection reads, mutation invalidation, and 15 second refreshes so changes made in another open CMS session appear without reloading. The database persists the latest content; React Query only manages browser cache and refresh.
