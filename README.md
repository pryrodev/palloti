# Pallotti Holy Family Province website

Next.js site and CMS for the Holy Family Province. CMS content is stored in MySQL through Prisma. Media uploads and selection use the Cloudinary Upload Widget; Cloudinary credentials stay on the server except the public cloud name and API key required by the widget.

## Local CMS setup

Requirements: Node.js 20+, npm, and Docker Desktop.

1. Copy `.env.example` to `.env` and set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and the Cloudinary values from your Cloudinary console.
2. Start MySQL: `docker compose up -d db`
3. Install dependencies: `npm install`
4. Generate Prisma Client and apply the schema: `npm run db:generate` then `npm run db:deploy`
5. Import the committed JSON and dictionary content: `npm run db:seed`
6. Start the site: `npm run dev`

The seed preserves existing editorial content. It fills new site settings such as SEO fields and hero slides into an existing `siteContent` record without replacing its saved copy.

## Environment values

- `DATABASE_URL`: MySQL connection string. Local default is `mysql://pallotti:local-app-password@127.0.0.1:33306/pallotti_cms`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the single CMS admin login credentials. There is no built-in default.
- `ADMIN_SESSION_SECRET`: long random secret used to sign the HTTP-only admin session cookie.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: server side Cloudinary configuration.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`: public widget configuration; never put the API secret here.
- `NEXT_PUBLIC_SITE_URL`: canonical production site URL used in SEO links, sitemap, and robots metadata.
- `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`: server-only contact form delivery settings. Verify the sender domain with Resend and use that domain in `CONTACT_FROM_EMAIL` before enabling production delivery.

For Vercel, configure these in the project environment settings and point `DATABASE_URL` at a managed MySQL service that supports connections from serverless functions. Run `npm run db:deploy` against that database during release, then run `npm run db:seed` to import initial content and safely fill newly added defaults. Do not expose a development database directly to the public internet.

## CMS data model

`cms_collections` stores the content sets (`news`, `communities`, `direction`, `gallery`, `videos`, `publications`, and `siteContent`) as validated JSON documents with a revision and update timestamp. The Site Content & Theme editor manages bilingual page copy, home hero slides, SEO titles/descriptions, and the shared site color palette. Dedicated editors manage articles, publications, communities, direction, gallery, and videos. `media_assets` stores Cloudinary uploads and inventories existing local images, videos, and PDFs so the media picker starts populated. New uploads go to Cloudinary. Every collection update is validated with Zod before Prisma writes it. Public pages load CMS-managed collections dynamically; checked-in JSON remains a local fallback until the DB has been initialized.

News articles and publications have editable SEO slugs, titles, and descriptions. Article and publication detail pages publish canonical/Open Graph metadata and JSON-LD, while `/sitemap.xml` lists public pages and content and `/robots.txt` excludes admin and API routes.

The admin uses TanStack Query hooks for cached collection reads and mutation cache updates. CMS collections stay fresh for 60 seconds and refresh on focus when stale; there is no background polling. The database persists the latest content, and React Query manages the browser cache.

The contact form sends messages through the server-side Resend API route. Add the Resend values above to local `.env` and Vercel settings; the API key and office recipient never reach the browser. See [ADR-001](docs/decisions/ADR-001-contact-email-resend.md) for the provider decision.
