# 🧠 Perceptex

> **AI-powered context that turns your digital clutter into structure.**

![Perceptex Banner](https://user-images.githubusercontent.com/your-banner.png)

---

## ✨ What is Perceptex?

Perceptex is your second brain and scheduling co-pilot. It passively captures important context from your digital life (email, browser, docs, and more), uses AI to infer intent ("this should be a meeting"), and helps you act on it—at the right time.

- **Inbox for your life:** See AI-generated suggestions and reminders in a beautiful, actionable inbox.
- **Smart context capture:** Chrome extension, email, and more—no manual entry required.
- **Approve, block, ignore:** One-click actions to turn suggestions into calendar events, reminders, or tasks.
- **Syncs with your tools:** Google Calendar, and more coming soon.
- **Modern, beautiful UI:** Built with Next.js, Tailwind, and ShadCN.

---

## 🚀 Tech Stack

- **Frontend:** Next.js 15, React, Tailwind CSS, ShadCN UI
- **Backend:** Next.js API routes, Prisma
- **Database:** Neon Postgres
- **AI Layer:** OpenAI/Claude (pluggable)
- **Vector DB:** pgvector (optional, for semantic memory)
- **Browser Extension:** Chrome (Manifest V3)

---

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Open http://localhost:3000
```

---

## 🖥️ Project Structure

```
perceptex/
├── app/
│   ├── dashboard/      # Dashboard UI
│   ├── inbox/          # Inbox UI
│   ├── components/     # Reusable UI components
│   ├── lib/            # Mock data, notifications, utils
│   └── ...
├── prisma/             # Prisma schema & migrations
├── public/             # Static assets
├── next.config.js      # Next.js config
└── ...
```

---

## ✨ Features

- 📨 **Inbox:** See and act on AI-generated suggestions
- 🗓️ **Calendar Sync:** Block time, create events
- 🔔 **Notifications:** Get notified of new context & suggestions
- 🧩 **Extensible:** Add new context sources easily
- 🎨 **Aesthetic UI:** Gradients, avatars, and smooth animations

---

## 🧑‍💻 Contributing

Pull requests are welcome! For major changes, open an issue first to discuss what you’d like to change.

---

## 📣 Credits

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [DiceBear Avatars](https://dicebear.com/)
- [Neon Postgres](https://neon.tech/)
- [Prisma](https://prisma.io/)

---

## 🦄 License

MIT

---

> _Perceptex: A quiet, smart assistant that understands what matters—and helps you act on it, at the right time._
