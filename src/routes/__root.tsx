import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: '車両メンテナンス記録',
      },
      {
        // ブラウザの上枠・Android のステータスバーの色。上部ナビの黒に合わせる
        name: 'theme-color',
        content: '#000000',
      },
      {
        // iOS のホーム画面でアイコンの下に出る名前。長いと省略されるので短くする
        name: 'apple-mobile-web-app-title',
        content: 'CAR DOC',
      },
      {
        name: 'application-name',
        content: 'CAR DOC',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      // iOS はここだけを見る。manifest の icons は参照しない
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16.png',
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
        sizes: '48x48',
      },
      {
        rel: 'manifest',
        href: '/manifest.webmanifest',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <Scripts />
      </body>
    </html>
  )
}
