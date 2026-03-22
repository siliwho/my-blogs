#!/usr/bin/env node
/**
 * new-post.js — Create a new blog post
 * Usage: npm run new-post
 */

const fs = require("fs");
const path = require("path");
const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const CATEGORIES = [
  "Embedded Systems",
  "Firmware",
  "Kernel / OS",
  "Systems Programming",
  "General",
];

async function main() {
  console.log("\n\x1b[36m┌─────────────────────────────┐\x1b[0m");
  console.log("\x1b[36m│  📝  New Blog Post           │\x1b[0m");
  console.log("\x1b[36m└─────────────────────────────┘\x1b[0m\n");

  console.log("\x1b[33mCategories:\x1b[0m");
  CATEGORIES.forEach((c, i) => console.log(`  \x1b[90m[${i + 1}]\x1b[0m ${c}`));
  console.log();

  const title = await ask("\x1b[32m Title       \x1b[0m: ");
  const description = await ask("\x1b[32m Description \x1b[0m: ");
  const catInput = await ask(
    `\x1b[32m Category    \x1b[0m [1-${CATEGORIES.length}]: `,
  );
  const tagsRaw = await ask("\x1b[32m Tags        \x1b[0m (comma-separated): ");
  const draftInput = await ask("\x1b[32m Draft?      \x1b[0m [Y/n]: ");
  rl.close();

  if (!title.trim()) {
    console.error("\x1b[31m✖ Title is required.\x1b[0m");
    process.exit(1);
  }

  const catIdx = parseInt(catInput) - 1;
  const category = CATEGORIES[catIdx] ?? CATEGORIES[0];
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const draft = !draftInput.trim() || draftInput.toLowerCase() !== "n";
  const slug = slugify(title);
  const date = new Date().toISOString().split("T")[0];

  const content = `---
title: "${title}"
description: "${description}"
date: "${date}"
tags: [${tags.map((t) => `"${t}"`).join(", ")}]
category: "${category}"
draft: ${draft}
---

# ${title}

${description}

## Introduction

Write your introduction here.

## Main Content

Your content goes here. You can use:

- **Bold**, *italic*, \`inline code\`
- Code blocks with syntax highlighting
- Images from \`public/blog-images/your-image.png\` → write as \`![alt text](your-image.png)\`
- Callouts: \`<Callout type="tip">text</Callout>\` (tip / info / warn / error)
- Figures with captions: \`<Figure src="img.png" caption="My caption" />\`

\`\`\`c
// Example code block
#include <stdio.h>

int main(void) {
    printf("Hello, kernel!\\n");
    return 0;
}
\`\`\`

## Conclusion

Wrap up here.
`;

  const outDir = path.join(process.cwd(), "content", "blog");
  const outPath = path.join(outDir, `${slug}.md`);

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  if (fs.existsSync(outPath)) {
    const overwrite = await ask(
      `\x1b[33m⚠  ${slug}.md already exists. Overwrite? [y/N]: \x1b[0m`,
    );
    if (overwrite.toLowerCase() !== "y") {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  fs.writeFileSync(outPath, content);

  console.log(
    `\n\x1b[32m✔ Created:\x1b[0m  content/blog/\x1b[1m${slug}.md\x1b[0m`,
  );
  console.log(`\x1b[90m  Title:    \x1b[0m${title}`);
  console.log(`\x1b[90m  Category: \x1b[0m${category}`);
  console.log(`\x1b[90m  Tags:     \x1b[0m${tags.join(", ") || "(none)"}`);
  console.log(`\x1b[90m  Draft:    \x1b[0m${draft}`);
  if (draft) {
    console.log(
      `\n\x1b[33m  → Set \x1b[1mdraft: false\x1b[0m\x1b[33m in the frontmatter when ready to publish.\x1b[0m`,
    );
  }
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
