# AI Healthcheck

AI Healthcheck helps organizations assess how maturely they are adopting AI across software development. Teams complete a guided assessment covering organizational context, AI foundations, and stages of the software delivery lifecycle, then review a scored report. Administrators can manage clients, assessment questions, and report narratives.

The application is built with Next.js and Prisma, with PostgreSQL as its database. It also includes AI-assisted narrative drafting.

## Run Locally

Prerequisites: Node.js, npm, and Docker Compose.

1. Install dependencies:

	```bash
	npm install
	```

2. Start the local PostgreSQL database:

	```bash
	docker compose up -d
	```

3. Create `.env` in the project root from the example file:

	```bash
	cp .env.example .env
	```

	Set a real `JWT_SECRET`, and add an `ANTHROPIC_API_KEY` if you want to use AI-assisted narrative drafting.

4. Apply database migrations and load the starter assessment data:

	```bash
	npx prisma migrate dev
	npx prisma db seed
	```

5. Start the development server:

	```bash
	npm run dev
	```

Open [http://localhost:3000](http://localhost:3000). The admin interface is at `/admin`; seeded administrator credentials are defined in `prisma/seed.ts`.

## Useful Commands

```bash
npm run lint   # Run ESLint
npm test       # Run tests with Vitest
npm run build  # Build for production
```
