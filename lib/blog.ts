import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  readingTime: string;
  draft?: boolean;
  content: string;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  const posts = files.map(filename => {
    const slug = filename.replace(/\.(md|mdx)$/, '');
    const fullPath = path.join(BLOG_DIR, filename);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { data, content } = matter(raw);
    const rt = readingTime(content);

    return {
      slug,
      title: data.title ?? 'Untitled',
      description: data.description ?? '',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      tags: data.tags ?? [],
      category: data.category ?? 'General',
      readingTime: rt.text,
      draft: data.draft ?? false,
      content,
    } as BlogPost;
  });

  return posts
    .filter(p => !p.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const extensions = ['.md', '.mdx'];
  for (const ext of extensions) {
    const fullPath = path.join(BLOG_DIR, `${slug}${ext}`);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data, content } = matter(raw);
      const rt = readingTime(content);
      return {
        slug,
        title: data.title ?? 'Untitled',
        description: data.description ?? '',
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        tags: data.tags ?? [],
        category: data.category ?? 'General',
        readingTime: rt.text,
        draft: data.draft ?? false,
        content,
      };
    }
  }
  return null;
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach(p => p.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const catSet = new Set<string>();
  posts.forEach(p => catSet.add(p.category));
  return Array.from(catSet).sort();
}
