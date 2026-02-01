'use client';

import { Amplify } from 'aws-amplify';
import config from '@/app/amplify_outputs.json';
import { useEffect } from 'react';

// Amplify設定を一度だけ実行
if (typeof window !== 'undefined') {
  Amplify.configure(config, { ssr: true });
}

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // クライアントサイドで確実に設定
    Amplify.configure(config, { ssr: true });
  }, []);

  return <>{children}</>;
}