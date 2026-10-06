// "My First Story!" -> "my-first-story"
export function slugify(text = '') {
    return text
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')     // anything else becomes a dash
      .replace(/^-+|-+$/g, '');        // no dashes at the start or end
  }