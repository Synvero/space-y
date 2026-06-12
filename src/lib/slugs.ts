export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6)
}

export function makeSlug(title: string): string {
  const base = slugify(title)
  return `${base}-${randomSuffix()}`
}
