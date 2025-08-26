'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div>
          <nav className="bg-blue-600 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">鉄拳キャラクターDB</h1>
              <div className="flex items-center gap-4">
                <span>こんにちは、{user?.username}さん</span>
                <button
                  onClick={signOut}
                  className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded"
                >
                  サインアウト
                </button>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </div>
      )}
    </Authenticator>
  );
}