#!/usr/bin/env node
/**
 * new-project.js — Add a new project to lib/projects.ts
 * Usage: npm run new-project
 */

const fs = require("fs");
const path = require("path");
const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

const CATEGORIES = ["embedded", "firmware", "kernel"];
const STATUSES = ["active", "wip", "completed"];

async function main() {
  console.log("\n\x1b[36m┌─────────────────────────────┐\x1b[0m");
  console.log("\x1b[36m│  🔧  New Project             │\x1b[0m");
  console.log("\x1b[36m└─────────────────────────────┘\x1b[0m\n");

  // ── Category ──
  console.log("\x1b[33mCategory:\x1b[0m");
  CATEGORIES.forEach((c, i) => console.log(`  \x1b[90m[${i + 1}]\x1b[0m ${c}`));
  const catInput = await ask("\x1b[32m Category    \x1b[0m [1-3]: ");
  const category = CATEGORIES[parseInt(catInput) - 1] ?? "embedded";

  // ── Status ──
  console.log("\n\x1b[33mStatus:\x1b[0m");
  STATUSES.forEach((s, i) => console.log(`  \x1b[90m[${i + 1}]\x1b[0m ${s}`));
  const statusInput = await ask("\x1b[32m Status      \x1b[0m [1-3]: ");
  const status = STATUSES[parseInt(statusInput) - 1] ?? "active";

  const title = await ask("\n\x1b[32m Title       \x1b[0m: ");
  const description = await ask("\x1b[32m Description \x1b[0m (1 line): ");
  const longDesc = await ask(
    "\x1b[32m Long desc   \x1b[0m (optional, Enter to skip): ",
  );
  const techRaw = await ask(
    "\x1b[32m Tech stack  \x1b[0m (comma-separated, e.g. C,STM32,FreeRTOS): ",
  );
  const githubUrl = await ask("\x1b[32m GitHub URL  \x1b[0m (optional): ");
  const demoUrl = await ask("\x1b[32m Demo URL    \x1b[0m (optional): ");
  const featInput = await ask("\x1b[32m Featured?   \x1b[0m [y/N]: ");

  let highlights = [];
  if (featInput.toLowerCase() === "y") {
    console.log(
      "\x1b[33m  Add highlights (key features). Empty line to stop.\x1b[0m",
    );
    for (let i = 1; i <= 6; i++) {
      const h = await ask(`\x1b[32m  Highlight ${i}\x1b[0m: `);
      if (!h.trim()) break;
      highlights.push(h.trim());
    }
  }

  rl.close();

  if (!title.trim()) {
    console.error("\x1b[31m✖ Title is required.\x1b[0m");
    process.exit(1);
  }

  const techStack = techRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const featured = featInput.toLowerCase() === "y";
  const id = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-");

  // ── Build the new project object as a string to inject ──
  const lines = [`  {`];
  lines.push(`    id: '${id}',`);
  lines.push(`    title: '${title.replace(/'/g, "\\'")}',`);
  lines.push(`    description: '${description.replace(/'/g, "\\'")}',`);
  if (longDesc.trim())
    lines.push(`    longDescription: '${longDesc.replace(/'/g, "\\'")}',`);
  lines.push(`    techStack: [${techStack.map((t) => `'${t}'`).join(", ")}],`);
  if (githubUrl.trim()) lines.push(`    githubUrl: '${githubUrl.trim()}',`);
  if (demoUrl.trim()) lines.push(`    demoUrl: '${demoUrl.trim()}',`);
  lines.push(`    category: '${category}',`);
  lines.push(`    status: '${status}',`);
  if (featured) {
    lines.push(`    featured: true,`);
    if (highlights.length) {
      lines.push(`    highlights: [`);
      highlights.forEach((h) =>
        lines.push(`      '${h.replace(/'/g, "\\'")}',`),
      );
      lines.push(`    ],`);
    }
  }
  lines.push(`  },`);
  const newEntry = lines.join("\n");

  // ── Inject into projects.ts before the closing ]; ──
  const projPath = path.join(process.cwd(), "lib", "projects.ts");
  if (!fs.existsSync(projPath)) {
    console.error(
      "\x1b[31m✖ lib/projects.ts not found. Are you running from the project root?\x1b[0m",
    );
    process.exit(1);
  }

  let src = fs.readFileSync(projPath, "utf-8");

  // Insert before the final ]; of the PROJECTS array
  const insertMarker = "];\n\nexport function";
  if (!src.includes(insertMarker)) {
    console.error(
      "\x1b[31m✖ Could not find insertion point in projects.ts.\x1b[0m",
    );
    console.log(
      "\x1b[33m  Paste this manually into the PROJECTS array in lib/projects.ts:\x1b[0m\n",
    );
    console.log(newEntry);
    process.exit(1);
  }

  src = src.replace(insertMarker, `${newEntry}\n${insertMarker}`);
  fs.writeFileSync(projPath, src);

  console.log(`\n\x1b[32m✔ Project added to:\x1b[0m lib/projects.ts`);
  console.log(`\x1b[90m  ID:       \x1b[0m${id}`);
  console.log(`\x1b[90m  Category: \x1b[0m${category}`);
  console.log(`\x1b[90m  Status:   \x1b[0m${status}`);
  console.log(`\x1b[90m  Featured: \x1b[0m${featured}`);
  console.log(
    "\n\x1b[90m  → Run \x1b[0mnpm run dev\x1b[90m and visit /projects/" +
      category +
      " to see it.\x1b[0m\n",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
