// The only workflow stages. (No REVISION — the pipeline is strictly these four.)
export const STATUSES = ['BRIEF_PENDING', 'WRITING', 'REVIEW', 'COMPLETED'];

export const STATUS_LABELS = {
  BRIEF_PENDING: 'Brief Pending',
  WRITING: 'Writing',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
};

export const ARTICLE_TYPES_FALLBACK = [
  'Article', 'Blog Post', 'Webpage Copy', 'Social Post',
  'Product Description', 'Email Newsletter', 'Press Release', 'Case Study',
];
