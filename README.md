# devfolio — Developer Portfolio & Blog

A fast, minimal, developer-focused personal website built with **Next.js 15 (App Router)**, **Tailwind CSS**, and **MDX**. Designed for electronics students and systems developers.

![Preview](public/images/preview.png)

## ✨ Features

- **3 Themes** — Minimal Dark, Terminal Green, Soft Light
- **MDX Blog** — Write posts as `.md`/`.mdx` files with code highlighting, TOC, tags, search, reading time
- **Projects** — Separate pages for Embedded Systems, Firmware, and Kernel/OS projects
- **GitHub Heatmap** — Contribution graph + repository showcase
- **PDF Viewer** — In-browser PDF viewing with categories
- **RSS Feed** — Auto-generated at `/rss.xml`
- **Static Generation** — All pages pre-rendered at build time
- **SEO** — Meta tags, OpenGraph, structured data
- **Fully Responsive** — Mobile-first

---

## 🚀 Quick Start

```bash
# 1. Clone or download
git clone https://github.com/yourusername/devfolio
cd devfolio

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

---

## 📁 Project Structure

```
devfolio/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Home (hero + featured projects + recent posts)
│   ├── blog/
│   │   ├── page.tsx            # Blog listing with search + filters
│   │   └── [slug]/page.tsx     # Individual blog post
│   ├── projects/
│   │   ├── embedded/page.tsx   # Embedded systems projects
│   │   ├── firmware/page.tsx   # Firmware projects
│   │   └── kernel/page.tsx     # Kernel / OS projects
│   ├── pdfs/page.tsx           # PDF library with in-browser viewer
│   ├── activity/page.tsx       # GitHub heatmap
│   ├── about/page.tsx          # About page
│   └── rss.xml/route.ts        # RSS feed endpoint
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Sticky navbar with dropdown + theme toggle
│   │   └── Footer.tsx
│   ├── blog/
│   │   ├── BlogCard.tsx        # Blog post card
│   │   ├── MDXContent.tsx      # MDX renderer (syntax highlighting, TOC)
│   │   └── TableOfContents.tsx # Sticky sidebar TOC
│   ├── projects/
│   │   ├── ProjectCard.tsx     # Project card (compact)
│   │   └── ProjectsPage.tsx    # Full project page layout
│   └── ui/
│       ├── ThemeProvider.tsx   # Theme context (dark/terminal/light)
│       ├── ThemeToggle.tsx     # 3-button theme switcher
│       └── TerminalHero.tsx    # Animated terminal on home page
│
├── content/
│   └── blog/                   # ← Add your .md/.mdx posts here
│       ├── rtos-scheduler-from-scratch.md
│       ├── linux-kernel-module-guide.md
│       └── dma-uart-stm32.md
│
├── lib/
│   ├── blog.ts                 # Blog post utilities (read, parse, filter)
│   ├── projects.ts             # Projects data + helpers
│   ├── pdfs.ts                 # PDF metadata
│   └── config.ts               # Site-wide config (name, socials, etc.)
│
├── public/
│   └── pdfs/                   # ← Drop your PDF files here
│
└── scripts/
    └── new-post.js             # CLI to scaffold new blog posts
```

---

## ✏️ Customization

### 1. Personal Info

Edit **`lib/config.ts`**:

```ts
export const SITE_CONFIG = {
  name: 'Your Name',
  author: 'Your Full Name',
  description: 'Your tagline here',
  url: 'https://yoursite.vercel.app',
  github: 'https://github.com/yourusername',
  linkedin: 'https://linkedin.com/in/yourusername',
  email: 'you@example.com',
  githubUsername: 'yourusername', // For GitHub API heatmap
};
```

### 2. Writing a New Blog Post

**Option A: CLI scaffold**
```bash
npm run new-post
# Follow the prompts → creates content/blog/your-slug.md
# Set draft: false when ready to publish
```

**Option B: Manual**

Create `content/blog/my-post.md`:

```markdown
---
title: "My Post Title"
description: "Short description for SEO and cards"
date: "2024-12-01"
tags: ["Tag1", "Tag2"]
category: "Embedded Systems"
---

# My Post

Your content here. Supports full **Markdown**, `inline code`,
code blocks with syntax highlighting, and MDX components like:

<Callout type="tip">
This is a tip callout!
</Callout>
```

Available callout types: `info`, `warn`, `tip`.

### 3. Adding Projects

Edit **`lib/projects.ts`** — add an entry to the `PROJECTS` array:

```ts
{
  id: 'my-project',
  title: 'My Project',
  description: 'Short description shown on cards.',
  longDescription: 'Detailed description shown on featured cards.',
  techStack: ['C', 'STM32', 'FreeRTOS'],
  githubUrl: 'https://github.com/you/project',
  category: 'embedded', // 'embedded' | 'firmware' | 'kernel'
  status: 'completed',  // 'active' | 'completed' | 'wip'
  featured: true,       // Show in featured section + homepage
  highlights: [         // Bullet points (featured cards only)
    'Key feature 1',
    'Key feature 2',
  ],
}
```

### 4. Adding PDFs

1. Drop the file in `public/pdfs/filename.pdf`
2. Add metadata to `lib/pdfs.ts`:

```ts
{
  id: 'my-doc',
  title: 'Document Title',
  description: 'What this document covers.',
  category: 'Datasheets',  // Must match PDF_CATEGORIES array
  filename: 'filename.pdf',
  date: '2024-11-01',
  tags: ['tag1', 'tag2'],
}
```

### 5. GitHub Heatmap (Live Data)

The heatmap currently shows illustrative data. To connect your real GitHub data:

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens) (read:user scope)
2. Add to `.env.local`:
   ```
   GITHUB_TOKEN=ghp_yourtoken
   ```
3. The `GitHubActivity.tsx` component is ready to be swapped out with a server component that calls the GitHub GraphQL API — see the comments in the file.

---

## 🎨 Themes

| Theme | Toggle | Description |
|-------|--------|-------------|
| **Minimal Dark** | `Monitor` icon | Dark background, green accent — default |
| **Terminal** | `Terminal` icon | Pure black, phosphor green, scanlines |
| **Soft Light** | `Sun` icon | Light background, purple accent |

Theme is stored in `localStorage` and persists across sessions.

---

## 🔧 MDX Components

These custom components are available in all blog posts:

```mdx
<Callout type="info">Informational note</Callout>
<Callout type="warn">Warning — pay attention</Callout>
<Callout type="tip">Pro tip!</Callout>
```

---

## 🚢 Deployment

### Vercel (Recommended — Free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect your GitHub repo at vercel.com for auto-deploys on push
```

### Netlify

```bash
npm run build
# Deploy the .next/ directory
# Set build command: npm run build
# Set publish directory: .next
```

---

## ⚡ Performance

- Static Site Generation (SSG) for all pages
- No client-side data fetching on first load
- Fonts loaded via Google Fonts with `display=swap`
- Images optimized via Next.js Image component
- Target: 95+ Lighthouse score

---

## 📦 Tech Stack

| Purpose | Package |
|---------|---------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v3 |
| Markdown | next-mdx-remote |
| Frontmatter | gray-matter |
| Syntax highlighting | rehype-highlight |
| Reading time | reading-time |
| Icons | lucide-react |
| Dates | date-fns |

---

## 📄 License

MIT — use it, fork it, make it yours.
