This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Super Admin Features
- **Applications**: List, create, edit, delete, and change status to Approved/Rejected/Under Review with filtering/search. Every status change is recorded with timestamp and the admin who made it.
- **Programmes**: Create, read, update, delete upcoming programmes with title, description, date/time, location, image/file uploads (validated type/size, stored outside executable paths, served with correct content types).
- **Branding**: Upload/replace site logo (PNG/JPG/SVG) with preview; updates apply immediately across the public site.
- **User management**: List/create/edit users, assign roles, reset passwords (temporary password that must be changed at next login), suspend/disable or delete accounts. View login email only; passwords/hashes never displayed.
- **Messaging**: Inbox-style messaging with one thread per user, unread indicators, timestamps. Admin can send messages; users can reply from their dashboard. Messages stored in DB.
- **Editable content**: Manage site text from the database/config via the admin area without redeploy.
- **Audit log**: Tracks admin actions (who, what, when).
- **Security**: Super Admin required for admin routes; server-side auth/role checks on all mutating endpoints; Zod validation; password hashing with bcrypt; parameterised/ORM queries; secure file upload validation.

## Running migrations and seeding
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed (idempotent). Uses env vars:
# SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME
npm run db:seed
```

## Tests
```bash
npm test
```
