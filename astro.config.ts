import { defineConfig } from 'astro/config'

import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import expressiveCode from 'astro-expressive-code'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'

import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'

import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://jrxna.com', // Update with your domain
  // Static output - API routes are handled by Cloudflare Pages Functions in /functions folder
  integrations: [
    expressiveCode({
      themes: ['github-dark'],
      plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
      useDarkModeMediaQuery: false,
      defaultProps: {
        wrap: true,
        collapseStyle: 'collapsible-auto',
        overridesByLang: {
          'ansi,bat,bash,batch,cmd,console,powershell,ps,ps1,psd1,psm1,sh,shell,shellscript,shellsession,text,zsh':
            {
              showLineNumbers: false,
            },
        },
      },
      styleOverrides: {
        codeFontSize: '13px',
        borderColor: '#555555',
        borderWidth: '1px',
        borderRadius: '0',
        codeFontFamily: 'var(--font-mono)',
        codeBackground: '#312D2A',
        frames: {
          editorActiveTabForeground: '#F5F5F5',
          editorActiveTabBackground: '#312D2A',
          editorActiveTabIndicatorBottomColor: 'transparent',
          editorActiveTabIndicatorTopColor: 'transparent',
          editorTabBorderRadius: '0',
          editorTabBarBackground: '#312D2A',
          editorTabBarBorderBottomColor: '#555555',
          frameBoxShadowCssValue: 'none',
          terminalBackground: '#312D2A',
          terminalTitlebarBackground: '#312D2A',
          terminalTitlebarBorderBottomColor: '#555555',
          terminalTitlebarForeground: '#F5F5F5',
        },
        lineNumbers: {
          foreground: '#888888',
        },
        uiFontFamily: 'var(--font-sans)',
      },
    }),
    mdx(),
    react(),
    sitemap(),
  ],
  vite: {
    // Type assertion needed due to Vite plugin type incompatibility between Astro and @tailwindcss/vite
    // This is the recommended approach per Astro documentation for Vite plugins
    plugins: [tailwindcss() as any],
  },
  server: {
    port: 1234,
    host: true,
  },
  devToolbar: {
    enabled: false,
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['nofollow', 'noreferrer', 'noopener'],
        },
      ],
      rehypeHeadingIds,
      rehypeKatex,
      [
        rehypePrettyCode,
        {
          theme: 'github-dark',
        },
      ],
    ],
    remarkPlugins: [remarkMath, remarkEmoji],
  },
})
