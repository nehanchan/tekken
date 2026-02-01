'use client';

import { Authenticator, translations } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import { resetPassword } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import './authenticator-styles.css';
import React, { useState } from 'react';

I18n.putVocabularies({
  ja: {
    ...translations.ja,
    'Sign In': 'ログイン',
    'Sign Up': '新規登録',
    'Create Account': '新規登録',
    'Sign in': 'ログイン',
    'Forgot your password?': 'パスワードをお忘れの方はこちら',
    'Reset Password': 'パスワードをリセット',
    'Reset your password': 'パスワードをリセット',
    'Back to Sign In': 'ログインに戻る',
    'Send Code': 'コードを送信',
    'Send code': 'コードを送信',
    'Submit': '送信',
    'Email': 'メールアドレス',
    'Password': 'パスワード',
    'Confirm Password': 'パスワード(確認)',
    'Code': '確認コード',
    'New Password': '新しいパスワード',
    'Confirmation Code': '確認コード',
    'Confirm': '確認',
    'We Emailed You': '確認用Eメールを送信しました',
    'Your code is on the way. To log in, enter the code we emailed to': 
      '確認コードを送信しました。ログインするには、以下のメールアドレスに送信されたコードを入力してください:',
    'It may take a minute to arrive.': 'メールが届くまでしばらく時間がかかる場合があります。',
    '. It may take a minute to arrive.': ' メールが届くまでしばらく時間がかかる場合があります。',
    'It may take a minute to arrive': 'メールが届くまでしばらく時間がかかる場合があります',
    'Resend Code': '',
    'Confirm Sign Up': 'アカウントを確認',
    'Enter your code': '確認コードを入力',
    'Enter your Confirmation Code': '確認コードを入力',
    'Enter your email': 'メールアドレスを入力',
  }
});

I18n.setLanguage('ja');

// パスワードリセット用のカスタムフッター
function CustomSignInFooter() {
  const [showResetForm, setShowResetForm] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setMessage('メールアドレスを入力してください');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await resetPassword({ username: email });
      setMessage('パスワードリセット用のコードをメールで送信しました。メールを確認してください。');
      
      // 3秒後にメッセージをクリア
      setTimeout(() => {
        setShowResetForm(false);
        setMessage('');
        setEmail('');
      }, 3000);
    } catch (error: any) {
      console.error('パスワードリセットエラー:', error);
      setMessage(error.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (showResetForm) {
    return (
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(185, 28, 28, 0.2)'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fca5a5',
            marginBottom: '8px'
          }}>
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレスを入力"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '2px solid rgba(185, 28, 28, 0.4)',
              borderRadius: '6px',
              color: '#ffffff',
              outline: 'none'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleResetPassword();
              }
            }}
          />
        </div>

        {message && (
          <div style={{
            padding: '10px',
            marginBottom: '15px',
            background: message.includes('送信しました') 
              ? 'rgba(34, 197, 94, 0.2)' 
              : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${message.includes('送信しました') 
              ? 'rgba(34, 197, 94, 0.5)' 
              : 'rgba(239, 68, 68, 0.5)'}`,
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '13px'
          }}>
            {message}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={() => {
              setShowResetForm(false);
              setMessage('');
              setEmail('');
            }}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              background: 'rgba(107, 114, 128, 0.3)',
              border: '2px solid rgba(107, 114, 128, 0.5)',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            キャンセル
          </button>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              background: loading 
                ? 'rgba(107, 114, 128, 0.3)'
                : 'linear-gradient(135deg, #dc2626, #991b1b)',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '送信中...' : 'コードを送信'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      borderTop: '1px solid rgba(185, 28, 28, 0.2)'
    }}>
      <button
        type="button"
        onClick={() => setShowResetForm(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#60a5fa',
          fontSize: '14px',
          cursor: 'pointer',
          textDecoration: 'none',
          padding: '8px',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#93c5fd';
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#60a5fa';
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        パスワードをお忘れの方はこちら
      </button>
    </div>
  );
}

export default function MemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* CSS のみで削除 - JavaScript不使用 */}
      <style jsx global>{`
        /* Resend Codeボタン完全非表示 */
        [data-amplify-router="confirmSignUp"] button[type="button"],
        [data-amplify-router="confirmResetPassword"] button[type="button"],
        [data-amplify-router="confirmSignIn"] button[type="button"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          position: absolute !important;
          left: -10000px !important;
          pointer-events: none !important;
        }
      `}</style>
      
      {/* 背景を持つ外側のコンテナ */}
      <div style={{
        minHeight: '100vh',
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
          url('/backgrounds/background.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 0
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Authenticator
            loginMechanisms={['email']}
            signUpAttributes={['email']}
            components={{
              SignIn: {
                Footer() {
                  return <CustomSignInFooter />;
                }
              },
              ConfirmSignUp: {
                Header() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 20px 10px',
                    }}>
                      <h2 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: '15px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                      }}>
                        確認用Eメールを送信しました
                      </h2>
                    </div>
                  );
                },
                Footer() {
                  return null;
                }
              },
              ConfirmSignIn: {
                Header() {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 20px 10px',
                    }}>
                      <h2 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: '15px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                      }}>
                        確認用Eメールを送信しました
                      </h2>
                    </div>
                  );
                },
                Footer() {
                  return null;
                }
              },
            }}
            services={{
              async validateCustomSignUp(formData: Record<string, any>) {
                if (!formData.password || formData.password.length < 6) {
                  return {
                    password: 'パスワードは6文字以上で入力してください'
                  };
                }
              }
            }}
          >
            {({ signOut, user }: { signOut?: () => void; user?: any }) => (
              <div>
                {children}
              </div>
            )}
          </Authenticator>
        </div>
      </div>
    </>
  );
}