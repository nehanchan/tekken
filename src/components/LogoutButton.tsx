'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  const handleLogout = () => {
    if (confirm('ログアウトしますか？')) {
      signOut();
      router.push('/');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <span style={{
        color: '#fca5a5',
        fontSize: '14px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.9)'
      }}>
        {user?.signInDetails?.loginId}
      </span>
      <button
        onClick={handleLogout}
        style={{
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #6b7280, #4b5563)',
          color: '#ffffff',
          border: '2px solid rgba(75, 85, 99, 0.5)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #4b5563, #374151)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        }}
      >
        ログアウト
      </button>
    </div>
  );
}
