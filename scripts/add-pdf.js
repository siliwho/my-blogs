#!/usr/bin/env node
/**
 * add-pdf.js — Register a PDF in lib/pdfs.ts
 * Usage: npm run add-pdf
 *
 * Step 1: Copy your PDF to  public/pdfs/your-file.pdf
 * Step 2: Run this script → it adds the metadata entry to lib/pdfs.ts
 */

const fs = require("fs");
const path = require("path");
const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

const CATEGORIES = [
  "Datasheets",
  "Notes",
  "Research Papers",
  "Textbooks",
  "Presentations",
];

async function main() {
  console.log("\n\x1b[36m┌─────────────────────────────┐\x1b[0m");
  console.log("\x1b[36m│  📄  Add PDF                 │\x1b[0m");
  console.log("\x1b[36m└─────────────────────────────┘\x1b[0m");
  console.log(
    "\x1b[90m  Make sure your PDF is already in public/pdfs/\x1b[0m\n",
  );

  // List existing PDFs in public/pdfs/
  const pdfDir = path.join(process.cwd(), "public", "pdfs");
  const existing = fs.existsSync(pdfDir)
    ? fs.readdirSync(pdfDir).filter((f) => f.endsWith(".pdf"))
    : [];

  if (existing.length) {
    console.log("\x1b[33mPDFs already in public/pdfs/:\x1b[0m");
    existing.forEach((f) => console.log(`  \x1b[90m•\x1b[0m ${f}`));
    console.log();
  } else {
    console.log("\x1b[33m⚠  No PDFs found in public/pdfs/ yet.\x1b[0m");
    console.log("   Copy your PDF there first, then run this script.\n");
  }

  const filename = await ask(
    "\x1b[32m Filename    \x1b[0m (e.g. arm-ref.pdf): ",
  );
  if (!filename.trim().endsWith(".pdf")) {
    console.error("\x1b[31m✖ Filename must end with .pdf\x1b[0m");
    rl.close();
    process.exit(1);
  }

  const fullPath = path.join(pdfDir, filename.trim());
  if (!fs.existsSync(fullPath)) {
    console.log(
      `\x1b[33m⚠  ${filename} not found in public/pdfs/ — you can still register it,\x1b[0m`,
    );
    console.log(`   but the viewer won't work until the file is there.\n`);
  }

  const title = await ask("\x1b[32m Title       \x1b[0m: ");
  const description = await ask("\x1b[32m Description \x1b[0m: ");
  const tagsRaw = await ask("\x1b[32m Tags        \x1b[0m (comma-separated): ");

  console.log("\n\x1b[33mCategory:\x1b[0m");
  CATEGORIES.forEach((c, i) => console.log(`  \x1b[90m[${i + 1}]\x1b[0m ${c}`));
  const catInput = await ask(
    `\x1b[32m Category    \x1b[0m [1-${CATEGORIES.length}]: `,
  );
  rl.close();

  const category = CATEGORIES[parseInt(catInput) - 1] ?? "Notes";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const date = new Date().toISOString().split("T")[0];
  const id = filename.trim().replace(".pdf", "");

  const newEntry = `  {
    id: '${id}',
    title: '${title.replace(/'/g, "\\'")}',
    description: '${description.replace(/'/g, "\\'")}',
    category: '${category}',
    filename: '${filename.trim()}',
    date: '${date}',
    tags: [${tags.map((t) => `'${t}'`).join(", ")}],
  },`;

  // Inject into lib/pdfs.ts before the closing ];
  const pdfsPath = path.join(process.cwd(), "lib", "pdfs.ts");
  if (!fs.existsSync(pdfsPath)) {
    console.error("\x1b[31m✖ lib/pdfs.ts not found.\x1b[0m");
    console.log(
      "\n\x1b[33m  Paste this manually into the PDFS array:\x1b[0m\n",
    );
    console.log(newEntry);
    process.exit(1);
  }

  let src = fs.readFileSync(pdfsPath, "utf-8");
  const marker = "];\n";
  const lastIdx = src.lastIndexOf(marker);
  if (lastIdx === -1) {
    console.error("\x1b[31m✖ Could not find insertion point.\x1b[0m");
    console.log(
      "\n\x1b[33m  Add this manually to the PDFS array in lib/pdfs.ts:\x1b[0m\n",
    );
    console.log(newEntry);
    process.exit(1);
  }

  src = src.slice(0, lastIdx) + newEntry + "\n" + src.slice(lastIdx);
  fs.writeFileSync(pdfsPath, src);

  console.log(`\n\x1b[32m✔ PDF registered in:\x1b[0m lib/pdfs.ts`);
  console.log(`\x1b[90m  File:     \x1b[0m${filename.trim()}`);
  console.log(`\x1b[90m  Category: \x1b[0m${category}`);
  console.log(`\x1b[90m  Tags:     \x1b[0m${tags.join(", ") || "(none)"}`);
  console.log("\n\x1b[90m  → Visit \x1b[0m/pdfs\x1b[90m to see it.\x1b[0m\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
