'use client';

import { Authenticator, translations } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';
import './authenticator-styles.css';
import React from 'react';

I18n.putVocabularies({
  ja: {
    ...translations.ja,
    'Sign In': 'ログイン',
    'Sign Up': '新規登録',
    'Create Account': '新規登録',
    'Sign in': 'ログイン',
    'Forgot your password?': 'パスワードをお忘れの方',
    'Reset Password': 'パスワードをリセット',
    'Back to Sign In': 'ログインに戻る',
    'Send Code': 'コードを送信',
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
  }
});

I18n.setLanguage('ja');

export default function MemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JavaScript DOM操作を完全に削除
  // すべてCSSで対応
  
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
      
      <Authenticator
        loginMechanisms={['email']}
        signUpAttributes={['email']}
        components={{
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
          ConfirmResetPassword: {
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
                    パスワードリセット
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
          <div style={{
            minHeight: '100vh',
            background: `
              linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
              url('/backgrounds/background.jpg')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
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
              {children}
            </div>
          </div>
        )}
      </Authenticator>
    </>
  );
}
