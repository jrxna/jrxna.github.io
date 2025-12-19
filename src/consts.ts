import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'JRXNA',
  description:
    "I'm Joel Rego, and this is where I share what I'm building, learning, and thinking about. You'll find computer science tutorials, tech podcasts, news analysis, critical examination of biblical texts, study music, and more.",
  href: 'https://jrxna.com',
  author: 'your-author-id',
  locale: 'en-US',
  featuredPostCount: 7,
  postsPerPage: 7,
}



// Brevo Newsletter
// Get your API key from https://app.brevo.com/settings/keys/api
// Set it as an environment variable: BREVO_API_KEY=your-api-key
// Optional: Set BREVO_LIST_ID to automatically add subscribers to a specific list
// Optional: Set BREVO_TEMPLATE_ID for double opt-in confirmation email (default: 5)
export const BREVO = {
  apiKey: import.meta.env.BREVO_API_KEY || '',
  listId: import.meta.env.BREVO_LIST_ID || '',
  templateId: import.meta.env.BREVO_TEMPLATE_ID || '5',
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://youtube.com/@jrxna',
    label: 'YouTube',
  },
  {
    href: 'https://github.com/jrxna',
    label: 'GitHub',
  },
  {
    href: 'https://www.linkedin.com/in/jrxna/',
    label: 'LinkedIn',
  },
  {
    href: 'mailto:jrxna@outlook.com',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  YouTube: 'lucide:youtube',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}

