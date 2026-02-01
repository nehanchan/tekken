import AmplifyProvider from '@/components/AmplifyProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <style>{`
          /* グローバルリセット */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          /* html, body の余白を完全に削除 */
          html, body {
            width: 100%;
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden;
          }
          
          /* body のフォント設定 */
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
              sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* #__next の余白も削除（Next.jsのルート要素） */
          #__next {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }
        `}</style>
      </head>
      <body>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}