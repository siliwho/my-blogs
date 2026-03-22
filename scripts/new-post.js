#!/usr/bin/env node
// Usage: npm run new-post
// Creates a new blog post with today's date and a slug from the title

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
}

async function main() {
  console.log('\n📝 New Blog Post\n');
  const title = await ask('Title: ');
  const description = await ask('Description: ');
  const category = await ask('Category (e.g. Embedded Systems): ');
  const tagsRaw = await ask('Tags (comma-separated): ');
  rl.close();

  const slug = slugify(title);
  const date = new Date().toISOString().split('T')[0];
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  const frontmatter = `---
title: "${title}"
description: "${description}"
date: "${date}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
category: "${category}"
draft: true
---

# ${title}

Write your post here...
`;

  const filepath = path.join(process.cwd(), 'content', 'blog', `${slug}.md`);
  fs.writeFileSync(filepath, frontmatter);
  console.log(`\n✅ Created: content/blog/${slug}.md`);
  console.log('   Set draft: false when ready to publish.\n');
}

main().catch(console.error);
