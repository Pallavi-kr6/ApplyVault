# ApplyVault

ResumeTracker AI is a production-oriented SaaS scaffold for automatically tracking job applications from supported job boards and analyzing them with Groq.

## What is included

- Next.js 15 dashboard with TypeScript and Tailwind CSS
- Supabase Auth, PostgreSQL schema, Row Level Security, and private resume storage
- API routes for applications, status updates, resume upload, and AI analysis
- Chrome Extension Manifest V3 with modular extractors for LinkedIn, Greenhouse, Lever, and Workday
- Dashboard metrics, searchable application table, detail pages, resume upload, dark-mode-ready styling, loading and error states
- Drag-and-drop Kanban board with immediate database updates

## Project structure

```text
app/
  api/                       Next.js route handlers
  dashboard/                 dashboard, board, and detail pages
  login/                     Supabase magic-link sign-in
components/
  dashboard/                 dashboard client components
  layout/                    authenticated app shell
  ui/                        shadcn-style primitives
extension/
  src/extractors/            platform-specific extraction modules
  src/content.tsx            floating button and apply-click autosave
  src/popup.tsx              extension login/settings UI
  public/manifest.json       Chrome MV3 manifest copied to dist
lib/
  ai/                        Groq integration and resume scoring
  supabase/                  browser, server, and service clients
  types/                     shared application types
supabase/schema.sql          database, RLS, trigger, and storage setup
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-70b-versatile
```

Never expose `GROQ_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the extension or browser code.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable email OTP or magic links in Supabase Auth.
4. Add `http://localhost:3000/api/auth/callback` and your production callback URL to the allowed redirect URLs.
5. Confirm the `resumes` storage bucket exists and is private.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Chrome extension development

```bash
cd extension
npm install
npm run build
```

Then load `extension/dist` in Chrome at `chrome://extensions` with Developer Mode enabled.

The popup stores:

- API URL, for example `http://localhost:3000`
- Supabase access token for the signed-in user

The content script detects supported job boards, shows a floating save button, and attempts autosave when the user clicks an Apply button.

## Deployment

1. Push the repository to GitHub.
2. Create a Vercel project.
3. Add all environment variables from `.env.example`.
4. Set the Supabase Auth production callback URL to `https://your-domain.com/api/auth/callback`.
5. Deploy.
6. Build the extension and publish or distribute the generated `extension/dist` package.

## Notes

- Application creation inserts the application and raw snapshot first, then attempts AI analysis. If Groq is unavailable, the application is still saved.
- RLS ensures users only read and mutate their own applications, analyses, snapshots, resumes, and storage objects.
- Resume upload stores the file. Match scoring support is implemented in the AI route for supplied resume text; production extraction of text from uploaded PDF/DOCX can be added as a worker step.
