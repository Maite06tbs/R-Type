import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'R-Type Documentation',
  description: 'Complete Documentation of the R-Type project - ECS Game Engine, Client-Server Architecture, Network Protocol',
  base: '/R-Type/',  // Important pour GitHub Pages
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Game Engine', link: '/engine/overview' },
      { text: 'Server', link: '/server/architecture' },
      { text: 'Client', link: '/client/architecture' },
      { text: 'Network', link: '/network/protocol' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/README' },
          { text: 'Developer Guide', link: '/DEVELOPER' },
          { text: 'Technology Analysis', link: '/TECHNOLOGY_ANALYSIS' }
        ]
      },
      {
        text: 'Game Engine',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/engine/overview' },
          { text: 'Systems Reference', link: '/engine/systems' }
        ]
      },
      {
        text: 'Server Architecture',
        collapsed: false,
        items: [
          { text: 'Server Overview', link: '/server/architecture' }
        ]
      },
      {
        text: 'Client Architecture',
        collapsed: false,
        items: [
          { text: 'Client Overview', link: '/client/architecture' }
        ]
      },
      {
        text: 'Network Protocol',
        collapsed: false,
        items: [
          { text: 'UDP Protocol', link: '/network/protocol' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/EpitechPromo2027/B-CPP-500-COT-5-1-rtype-24' }
    ],

    footer: {
      message: 'R-Type Documentation - ECS Game Engine',
      copyright: 'Copyright © 2024 R-Type Team'
    }
  }
})