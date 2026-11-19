# Pallotti Holy Family Province website

Next.js site and CMS for the Holy Family Province. CMS content is stored in MySQL through Prisma. The shared media picker selects existing assets, uploads from a computer, or imports from Google Drive. New media is stored in Cloudinary; its API secret stays on the server.

## Local CMS setup

Requirements: Node.js 20+, npm, and Docker Desktop.

1. Copy `.env.example` to `.env`, set `BETTER_AUTH_SECRET` (generate with `npx auth@1.7.26 secret`), set `BETTER_AUTH_URL` to your app origin, and add the Cloudinary values from your Cloudinary console. Configure the Google Drive values below to enable Drive imports.
2. Start MySQL: `docker compose up -d db`
3. Install dependencies: `npm install`
4. Generate Prisma Client and apply the schema: `npm run db:generate` then `npm run db:deploy`
5. Create the first CMS admin with `npm run auth:create-admin -- --email admin@example.com --name "CMS Admin" --role admin`. The CLI prompts for the password so it is not saved in shell history.
6. Import the committed JSON and dictionary content: `npm run db:seed`
7. Start the site: `npm run dev`

The seed preserves existing editorial content. It fills new site settings such as SEO fields and hero slides into an existing `siteContent` record without replacing its saved copy.

## Environment values

- `DATABASE_URL`: MySQL connection string. Local default is `mysql://pallotti:local-app-password@127.0.0.1:33306/pallotti_cms`.
- `BETTER_AUTH_SECRET`: secret Better Auth uses to sign and protect sessions. Generate a unique value for each environment.
- `BETTER_AUTH_URL`: the canonical origin of this app (`http://localhost:3000` locally and your HTTPS site URL in production).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: server side Cloudinary configuration.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`: public widget configuration; never put the API secret here.
- `NEXT_PUBLIC_GOOGLE_API_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_APP_ID`: Google Picker configuration. Enable both the Google Picker API and Google Drive API in a Google Cloud project, create an API key and OAuth web client, and use the project number as the App ID. Restrict the API key to the production and local app origins plus `https://docs.google.com/*`, and restrict it to the Picker and Drive APIs. Add the app origins to the OAuth client's authorized JavaScript origins. The OAuth consent screen must permit the CMS staff who use Drive imports.
- `NEXT_PUBLIC_SITE_URL`: canonical production site URL used in SEO links, sitemap, and robots metadata.
- `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`: server-only contact form delivery settings. Verify the sender domain with Resend and use that domain in `CONTACT_FROM_EMAIL` before enabling production delivery.

For Vercel, configure these in the project environment settings and point `DATABASE_URL` at a managed MySQL service that supports connections from serverless functions. Run `npm run db:deploy` against that database during release, create the first admin using the Better Auth CLI, then run `npm run db:seed` to import initial content and safely fill newly added defaults. Do not expose a development database directly to the public internet.

Better Auth manages the CMS admin's email/password account and database-backed sessions. Public sign-up is disabled; create admin users through trusted server-side provisioning only. Admin APIs and pages require an unbanned user with the `admin` role.

## CMS data model

`cms_collections` stores the content sets (`news`, `communities`, `direction`, `gallery`, `videos`, `publications`, and `siteContent`) as validated JSON documents with a revision and update timestamp. The Site Content & Theme editor manages bilingual page copy, home hero slides, SEO titles/descriptions, and the shared site color palette. Dedicated editors manage articles, publications, communities, direction, gallery, and videos. `media_assets` stores Cloudinary uploads and inventories existing local images, videos, and PDFs so the media picker starts populated. New uploads go to Cloudinary. Every collection update is validated with Zod before Prisma writes it. Public pages load CMS-managed collections dynamically; checked-in JSON remains a local fallback until the DB has been initialized.

News articles and publications have editable SEO slugs, titles, and descriptions. Article and publication detail pages publish canonical/Open Graph metadata and JSON-LD, while `/sitemap.xml` lists public pages and content and `/robots.txt` excludes admin and API routes.

The admin uses TanStack Query hooks for cached collection reads and mutation cache updates. CMS collections stay fresh for 60 seconds and refresh on focus when stale; there is no background polling. The database persists the latest content, and React Query manages the browser cache.

The contact form sends messages through the server-side Resend API route. Add the Resend values above to local `.env` and Vercel settings; the API key and office recipient never reach the browser. See [ADR-001](docs/decisions/ADR-001-contact-email-resend.md) for the provider decision.

Google Drive imports use the Google Picker with the `drive.file` scope. The selected file is streamed through the protected admin API into Cloudinary and then added to the shared media library; the temporary Google access token is not stored. Google Workspace documents are imported as PDFs. The Google Picker needs the public API key, OAuth client ID, and numeric project number configured in the environment. See Google's [Picker web app setup](https://developers.google.com/workspace/drive/picker/guides/web-picker) and [GIS token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
