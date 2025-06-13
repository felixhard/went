# create-went-app

> The fastest way to create production-ready Next.js applications with authentication, database, and modern tooling.

## Quick Start

```bash
npx create-went-app@latest my-app
cd my-app
npm run dev
```

## What You Get

A complete, production-ready Next.js application with:

- **🔐 Authentication** - NextAuth.js with secure credential-based login
- **🗄️ Database** - Prisma ORM with PostgreSQL integration
- **🎨 Modern UI** - Tailwind CSS v4 with shadcn/ui components
- **📧 Email** - Resend integration for transactional emails
- **🔄 Type-safe APIs** - tRPC for end-to-end type safety
- **⚡ Latest Stack** - Next.js 15, React 19, TypeScript

## Features

### Authentication System
- Secure login/signup with bcrypt password hashing
- Password reset functionality via email
- Protected routes with middleware
- Session management with NextAuth.js

### Database Integration
- Prisma schema with User model
- Database migrations and seeding
- Type-safe database queries
- PostgreSQL optimized

### Modern Development Experience
- TypeScript throughout the entire stack
- Hot reload and fast refresh
- ESLint and Prettier configured
- Production-ready build setup

### UI Components
- Pre-built authentication pages (login, signup, forgot password)
- Responsive dashboard layout
- shadcn/ui component library
- Tailwind CSS v4 with modern design tokens

## Project Structure

```
my-app/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and configurations
│   ├── server/              # tRPC routers and server logic
│   └── utils/               # Helper functions
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
└── package.json
```

## Setup Instructions

### 1. Create Your Project
```bash
npx create-went-app@latest my-app
cd my-app
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Add your database URL and email credentials to .env
# The AUTH_SECRET is already generated for you
```

### 3. Set Up Database
```bash
# Run migrations
npx prisma migrate dev

# Seed with sample data (optional)
npx prisma db seed
```

### 4. Start Development
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Your app's URL (auto-set in development) | Production only |
| `AUTH_SECRET` | Auth.js secret (auto-generated) | Yes |
| `RESEND_API_KEY` | Resend API key for emails | Yes |
| `FROM_EMAIL` | Sender email address | Yes |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open database browser

## Database Commands

If you have the went CLI installed globally:

```bash
went db migrate [name]  # Run database migration
went db generate        # Generate Prisma client
went db reset          # Reset database
went db seed           # Seed database
```

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Email:** Resend
- **API:** tRPC for type-safe APIs
- **UI Components:** shadcn/ui

## Requirements

- Node.js 18 or higher
- PostgreSQL database
- Resend account (for email functionality)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see [LICENSE](LICENSE) file for details. 
