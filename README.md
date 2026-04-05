# Smart Auditorium Booking System — MERN/Next.js
### Deployed on Vercel + MongoDB Atlas (Both Free)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Next.js 14 App Router |
| Backend | Next.js API Routes (serverless) |
| Database | MongoDB Atlas (free 512MB) |
| Auth | JWT via jose + httpOnly cookies |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Deployment | Vercel (free) |

---

## Step 1 — Create MongoDB Atlas Database (Free)

1. Go to **https://cloud.mongodb.com**
2. Click **"Try Free"** → Sign up (no credit card needed)
3. Choose **"M0 Free Tier"** (512MB, always free)
4. Select any region (choose closest to India: Mumbai/Singapore)
5. Click **"Create Deployment"**
6. Set username and password → **Save them** → Click "Create Database User"
7. In "Where would you like to connect from?" → choose **"My Local Environment"**
8. Add IP: `0.0.0.0/0` (allows all IPs — needed for Vercel) → Click "Add Entry"
9. Click **"Done"**
10. On the dashboard, click **"Connect"** → **"Drivers"**
11. Copy the connection string. It looks like:
    ```
    mongodb+srv://yourname:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
    ```
12. Replace `<password>` with your actual password
13. Add the database name before `?`:
    ```
    mongodb+srv://yourname:yourpassword@cluster0.xxxxx.mongodb.net/smart_auditorium?retryWrites=true&w=majority
    ```
14. **Save this string** — you'll need it in Step 3

---

## Step 2 — Push Code to GitHub

1. Go to **https://github.com** → New repository → name it `smart-auditorium`
2. Set to **Public** (free) → Create repository
3. On your computer, open terminal/command prompt in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOURUSERNAME/smart-auditorium.git
   git push -u origin main
   ```
   Replace `YOURUSERNAME` with your GitHub username

---

## Step 3 — Deploy to Vercel

1. Go to **https://vercel.com** → Sign up with GitHub (free)
2. Click **"New Project"**
3. Find your `smart-auditorium` repo → Click **"Import"**
4. Vercel auto-detects Next.js — don't change Framework settings
5. Click **"Environment Variables"** → Add these 3 variables:

   | Name | Value |
   |---|---|
   | `MONGODB_URI` | Your Atlas connection string from Step 1 |
   | `JWT_SECRET` | Any random string of 32+ chars (e.g. `mycollegeprojectsecretkey2025abcd`) |
   | `NEXTAUTH_URL` | Leave blank for now (Vercel auto-sets this) |

6. Click **"Deploy"**
7. Wait ~2 minutes for build to complete
8. You get a free URL like: `https://smart-auditorium-xyz.vercel.app`

---

## Step 4 — Seed the Database

After deployment, visit this URL once to create all demo data:
```
https://your-vercel-url.vercel.app/api/seed
```
You should see: `{"seeded": true}`

If it says `{"alreadySeeded": true}` — that's fine too, data is already there.

---

## Step 5 — Login and Test

Visit your Vercel URL and log in with:

| Role | Email | Password |
|---|---|---|
| Admin | admin@college.edu | password123 |
| HOD | hod.cse@college.edu | password123 |
| Faculty | meena@college.edu | password123 |

---

## Local Development Setup

1. Install Node.js from **https://nodejs.org** (v18 or higher)
2. Create `.env.local` file in project root:
   ```
   MONGODB_URI=mongodb+srv://yourname:password@cluster0.xxxxx.mongodb.net/smart_auditorium
   JWT_SECRET=any-random-string-at-least-32-chars
   NEXTAUTH_URL=http://localhost:3000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run development server:
   ```bash
   npm run dev
   ```
5. Open **http://localhost:3000**
6. Visit **http://localhost:3000/api/seed** once to populate demo data

---

## Project Structure

```
smart-auditorium/
├── app/
│   ├── (app)/                    ← Protected pages (require login)
│   │   ├── dashboard/page.jsx
│   │   ├── calendar/page.jsx
│   │   ├── notifications/page.jsx
│   │   ├── profile/page.jsx
│   │   ├── faculty/
│   │   │   ├── new-booking/page.jsx
│   │   │   └── bookings/
│   │   │       ├── page.jsx
│   │   │       └── [id]/page.jsx
│   │   └── admin/
│   │       ├── pending/page.jsx
│   │       ├── analytics/page.jsx
│   │       ├── users/page.jsx
│   │       └── halls/page.jsx
│   ├── api/                      ← API routes (serverless functions)
│   │   ├── auth/login/route.js
│   │   ├── auth/logout/route.js
│   │   ├── auth/me/route.js
│   │   ├── bookings/route.js
│   │   ├── bookings/[id]/route.js
│   │   ├── halls/route.js
│   │   ├── slots/route.js
│   │   ├── notifications/route.js
│   │   ├── users/route.js
│   │   ├── analytics/route.js
│   │   └── seed/route.js
│   ├── login/page.jsx
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── AuthProvider.jsx           ← JWT session context
│   └── AppLayout.jsx             ← Sidebar + navigation
├── lib/
│   ├── db.js                     ← MongoDB connection
│   ├── auth.js                   ← JWT sign/verify/cookies
│   ├── utils.js                  ← Helpers, notify, audit
│   └── seed.js                   ← Demo data seeder
├── models/
│   └── index.js                  ← All Mongoose schemas
├── .env.example                  ← Env variable template
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Features

- Role-based access: Admin, HOD, Faculty
- Real-time slot availability (AJAX)
- Approval workflow: pending → approved/rejected
- Priority-based override (Admin > HOD > Faculty)
- Smart slot recommendations on conflict
- Weekly calendar view with click-to-book
- In-app notifications with unread badge
- Analytics dashboard (Admin only) with Recharts
- Audit log of all actions
- JWT auth with httpOnly cookies (secure)
- Fully responsive (mobile sidebar)
- Auto-seeds demo data on first visit

---

## Viva Q&A

**Q: How is double-booking prevented?**
A: MongoDB partial unique index on `{hall, bookingDate, slot}` where `status = approved`. Plus server-side check before insert.

**Q: How does JWT auth work?**
A: On login, a signed JWT is set as an httpOnly cookie (not accessible by JavaScript). Every API route calls `requireAuth(request)` which reads and verifies the cookie using the `jose` library.

**Q: How does priority override work?**
A: When approving booking B, the server checks for an existing approved booking A on the same hall/date/slot. If B.priority > A.priority, A is auto-rejected with a notification sent, and B is approved.

**Q: Why Next.js instead of separate React + Express?**
A: Next.js API routes act as the backend, so one repo = one deploy. No CORS issues, no separate server. Vercel deploys each API route as a serverless function automatically.

---

*Smart Auditorium Booking System — Final Year Project*
