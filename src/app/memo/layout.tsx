'use client';

import { Authenticator, translations } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';

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
    'Confirm Password': 'パスワード（確認）',
    'Code': '確認コード',
    'New Password': '新しいパスワード',
    'Confirmation Code': '確認コード',
    'Confirm': '確認',
    'We Emailed You': '確認用Eメールを送信しました',
    'Your code is on the way. To log in, enter the code we emailed to': 
      '確認コードを送信しました。ログインするには、以下のメールアドレスに送信されたコードを入力してください：',
    'It may take a minute to arrive.': '',
    '. It may take a minute to arrive.': '',
    'Resend Code': 'コードを再送信',
    'Confirm Sign Up': 'アカウントを確認',
    'Enter your code': '確認コードを入力',
    'Enter your Confirmation Code': '確認コードを入力',
  }
});

I18n.setLanguage('ja');

export default function MemoLayout({
  children,
}: {
  children: React.reactNode;
}) {
  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        [data-amplify-authenticator] {
          min-height: 100vh !important;
          background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
                      url('/backgrounds/background.jpg') !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
          background-repeat: no-repeat !important;
          position: relative !important;
        }

        [data-amplify-authenticator]::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") !important;
          pointer-events: none !important;
          z-index: 0 !important;
        }

        [data-amplify-authenticator] [data-amplify-container] {
          background: transparent !important;
          padding: 0 !important;
          position: relative !important;
          z-index: 1 !important;
        }

        [data-amplify-authenticator] [data-amplify-router] {
          background: linear-gradient(135deg, #dc2626, #991b1b) !important;
          padding: 3px !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8) !important;
          max-width: 480px !important;
          margin: 60px auto !important;
          position: relative !important;
          z-index: 1 !important;
        }

        [data-amplify-authenticator] [data-amplify-form] {
          background: rgba(0, 0, 0, 0.95) !important;
          border-radius: 10px !important;
          padding: 0 !important;
        }

        [data-amplify-authenticator] [data-amplify-tabs] {
          background: transparent !important;
          border-bottom: 2px solid rgba(185, 28, 28, 0.5) !important;
        }

        [data-amplify-authenticator] [data-amplify-tabs-item] {
          color: #ffffff !important;
          font-weight: 600 !important;
          font-size: 16px !important;
          padding: 15px 30px !important;
          border-bottom: 3px solid transparent !important;
          transition: all 0.2s !important;
          background: transparent !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
        }

        [data-amplify-authenticator] [data-amplify-tabs-item],
        [data-amplify-authenticator] [data-amplify-tabs-item] button,
        [data-amplify-authenticator] [data-amplify-tabs-item] span,
        [data-amplify-authenticator] [data-amplify-tabs-item] div,
        [data-amplify-authenticator] [data-amplify-tabs-item] *,
        [data-amplify-authenticator] [role="tablist"] button,
        [data-amplify-authenticator] [role="tablist"] button span,
        [data-amplify-authenticator] [role="tablist"] button *,
        [data-amplify-authenticator] [role="tab"],
        [data-amplify-authenticator] [role="tab"] *,
        [data-amplify-authenticator] button[role="tab"],
        [data-amplify-authenticator] button[role="tab"] span,
        [data-amplify-authenticator] button[role="tab"] * {
          color: #ffffff !important;
          font-weight: 600 !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
        }

        [data-amplify-authenticator] [data-amplify-tabs-item][aria-selected="true"],
        [data-amplify-authenticator] [data-amplify-tabs-item][aria-selected="true"] button,
        [data-amplify-authenticator] [data-amplify-tabs-item][aria-selected="true"] span,
        [data-amplify-authenticator] [data-amplify-tabs-item][aria-selected="true"] *,
        [data-amplify-authenticator] [role="tab"][aria-selected="true"],
        [data-amplify-authenticator] [role="tab"][aria-selected="true"] *,
        [data-amplify-authenticator] button[role="tab"][aria-selected="true"],
        [data-amplify-authenticator] button[role="tab"][aria-selected="true"] span,
        [data-amplify-authenticator] button[role="tab"][aria-selected="true"] * {
          color: #ffffff !important;
          border-bottom-color: #ffffff !important;
          background: rgba(255, 255, 255, 0.1) !important;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
          font-weight: 600 !important;
        }

        [data-amplify-authenticator] [data-amplify-tabs-item]:hover,
        [data-amplify-authenticator] [data-amplify-tabs-item]:hover button,
        [data-amplify-authenticator] [data-amplify-tabs-item]:hover span,
        [data-amplify-authenticator] [data-amplify-tabs-item]:hover *,
        [data-amplify-authenticator] [role="tab"]:hover,
        [data-amplify-authenticator] [role="tab"]:hover *,
        [data-amplify-authenticator] button[role="tab"]:hover,
        [data-amplify-authenticator] button[role="tab"]:hover span,
        [data-amplify-authenticator] button[role="tab"]:hover * {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }

        [data-amplify-authenticator] [data-amplify-fieldset] {
          padding: 30px !important;
          background: transparent !important;
        }

        [data-amplify-authenticator] label {
          color: #fef2f2 !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          margin-bottom: 8px !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
        }

        [data-amplify-authenticator] input {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(185, 28, 28, 0.5) !important;
          border-radius: 6px !important;
          color: #ffffff !important;
          font-size: 14px !important;
          padding: 12px !important;
          transition: all 0.2s !important;
        }

        [data-amplify-authenticator] input:focus {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2) !important;
          outline: none !important;
          background: rgba(255, 255, 255, 0.15) !important;
        }

        [data-amplify-authenticator] input::placeholder {
          color: #6b7280 !important;
        }

        [data-amplify-authenticator] [data-amplify-field] button,
        [data-amplify-authenticator] [data-amplify-field-group] button,
        [data-amplify-authenticator] [data-amplify-field-group__control] button,
        [data-amplify-authenticator] [data-amplify-password-field] button,
        [data-amplify-authenticator] input[type="password"] ~ button,
        [data-amplify-authenticator] input[type="text"][name*="password"] ~ button,
        [data-amplify-authenticator] label:has(+ input[type="password"]) ~ button,
        [data-amplify-authenticator] div:has(> input[type="password"]) button,
        [data-amplify-authenticator] div:has(> input[name*="password"]) button,
        [data-amplify-authenticator] button[aria-label*="password"],
        [data-amplify-authenticator] button[aria-label*="Show"],
        [data-amplify-authenticator] button[aria-label*="Hide"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          pointer-events: none !important;
        }

        [data-amplify-authenticator] [data-amplify-field] input,
        [data-amplify-authenticator] [data-amplify-field-group] input,
        [data-amplify-authenticator] [data-amplify-field-group__control] input,
        [data-amplify-authenticator] [data-amplify-password-field] input {
          width: 100% !important;
          padding-right: 12px !important;
        }

        [data-amplify-authenticator] button[type="submit"] {
          background: linear-gradient(135deg, #dc2626, #991b1b) !important;
          border: none !important;
          border-radius: 6px !important;
          color: #ffffff !important;
          font-weight: bold !important;
          font-size: 16px !important;
          padding: 12px !important;
          width: 100% !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }

        [data-amplify-authenticator] button[type="submit"]:hover {
          background: linear-gradient(135deg, #ef4444, #dc2626) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }

        [data-amplify-authenticator] button[type="submit"]:active {
          transform: translateY(0) !important;
        }

        [data-amplify-authenticator] button[data-amplify-router-content] {
          color: #93c5fd !important;
          font-size: 14px !important;
          text-decoration: none !important;
          background: transparent !important;
          border: none !important;
          padding: 8px 0 !important;
          cursor: pointer !important;
          transition: color 0.2s !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
        }

        [data-amplify-authenticator] button[data-amplify-router-content]:hover {
          color: #dbeafe !important;
          text-decoration: underline !important;
        }

        /* ★★★ ここから「コードを再送信」ボタンのスタイル ★★★ */
        /* 行番号: 約235-280行目 */
        
        button[data-amplify-footer-content],
        [data-amplify-footer] button:not([type="submit"]),
        [data-amplify-authenticator] [data-amplify-router="confirmSignUp"] button:not([type="submit"]),
        [data-amplify-authenticator] [data-amplify-router="confirmSignIn"] button:not([type="submit"]) {
          background: none !important;
          background-color: transparent !important;
          background-image: none !important;
          border: 0 !important;
          border-radius: 0 !important;
          padding: 8px 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
          text-decoration: none !important;
          width: auto !important;
          display: inline !important;
          color: #93c5fd !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
          transition: color 0.2s !important;
          cursor: pointer !important;
        }

        button[data-amplify-footer-content] span,
        button[data-amplify-footer-content] *,
        [data-amplify-footer] button:not([type="submit"]) span,
        [data-amplify-footer] button:not([type="submit"]) *,
        [data-amplify-authenticator] [data-amplify-router="confirmSignUp"] button:not([type="submit"]) span,
        [data-amplify-authenticator] [data-amplify-router="confirmSignIn"] button:not([type="submit"]) span,
        [data-amplify-authenticator] [data-amplify-router="confirmSignUp"] button:not([type="submit"]) *,
        [data-amplify-authenticator] [data-amplify-router="confirmSignIn"] button:not([type="submit"]) * {
          color: #93c5fd !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
          background: none !important;
          border: none !important;
        }

        button[data-amplify-footer-content]:hover,
        [data-amplify-footer] button:not([type="submit"]):hover,
        [data-amplify-authenticator] [data-amplify-router="confirmSignUp"] button:not([type="submit"]):hover,
        [data-amplify-authenticator] [data-amplify-router="confirmSignIn"] button:not([type="submit"]):hover {
          color: #dbeafe !important;
          text-decoration: underline !important;
          background: none !important;
          border: none !important;
          transform: none !important;
          box-shadow: none !important;
        }

        button[data-amplify-footer-content]:hover span,
        button[data-amplify-footer-content]:hover *,
        [data-amplify-footer] button:not([type="submit"]):hover span,
        [data-amplify-footer] button:not([type="submit"]):hover *,
        [data-amplify-authenticator] [data-amplify-router="confirmSignUp"] button:not([type="submit"]):hover span,
        [data-amplify-authenticator] [data-amplify-router="confirmSignIn"] button:not([type="submit"]):hover span,
        [data-amplify-authenticator] [data-amplify-router="confirmSignUp"] button:not([type="submit"]):hover *,
        [data-amplify-authenticator] [data-amplify-router="confirmSignIn"] button:not([type="submit"]):hover * {
          color: #dbeafe !important;
        }

        /* ★★★ ここまでが「コードを再送信」ボタンのスタイル ★★★ */

        [data-amplify-authenticator] button[data-amplify-router-back] {
          color: #d1d5db !important;
          font-size: 13px !important;
          background: transparent !important;
          border: none !important;
          padding: 8px !important;
          cursor: pointer !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
        }

        [data-amplify-authenticator] button[data-amplify-router-back]:hover {
          color: #ffffff !important;
        }

        [data-amplify-authenticator] [role="alert"] {
          background: rgba(239, 68, 68, 0.3) !important;
          border: 1px solid rgba(239, 68, 68, 0.6) !important;
          border-radius: 6px !important;
          color: #fef2f2 !important;
          padding: 12px !important;
          font-size: 13px !important;
          margin-bottom: 16px !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
        }

        [data-amplify-authenticator] [data-amplify-footer] {
          background: transparent !important;
          padding: 20px !important;
        }

        [data-amplify-authenticator] h1,
        [data-amplify-authenticator] h2,
        [data-amplify-authenticator] h3 {
          color: #ffffff !important;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.9) !important;
        }

        [data-amplify-authenticator] p,
        [data-amplify-authenticator] div {
          color: #ffffff !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
        }

        [data-amplify-authenticator] [data-amplify-router="confirmSignUp"] *:not(input):not(button[type="submit"]):not([role="tab"]):not([role="tab"] *):not(button):not(button *),
        [data-amplify-authenticator] [data-amplify-router="confirmSignIn"] *:not(input):not(button[type="submit"]):not([role="tab"]):not([role="tab"] *):not(button):not(button *) {
          color: #ffffff !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
        }

        [data-amplify-authenticator] [data-amplify-router="confirmSignUp"],
        [data-amplify-authenticator] [data-amplify-router="confirmSignIn"] {
          color: #ffffff !important;
        }

        [data-amplify-authenticator] [data-amplify-router="confirmSignUp"] > *,
        [data-amplify-authenticator] [data-amplify-router="confirmSignIn"] > * {
          color: #ffffff !important;
        }

        @media (max-width: 768px) {
          [data-amplify-authenticator] [data-amplify-router] {
            margin: 20px !important;
            max-width: calc(100% - 40px) !important;
          }

          [data-amplify-authenticator] [data-amplify-fieldset] {
            padding: 20px !important;
          }
        }
      `}</style>

      <Authenticator
        formFields={{
          signIn: {
            username: {
              label: 'メールアドレス',
              placeholder: 'example@email.com',
              isRequired: true,
            },
            password: {
              label: 'パスワード',
              placeholder: 'パスワードを入力',
              isRequired: true,
            }
          },
          signUp: {
            email: {
              label: 'メールアドレス',
              placeholder: 'example@email.com',
              isRequired: true,
            },
            password: {
              label: 'パスワード',
              placeholder: 'パスワードを入力（6文字以上）',
              isRequired: true,
            },
            confirm_password: {
              label: 'パスワード（確認）',
              placeholder: 'パスワードを再入力',
              isRequired: true,
            }
          },
          forceNewPassword: {
            password: {
              label: '新しいパスワード',
              placeholder: '新しいパスワードを入力',
              isRequired: true,
            }
          },
          confirmResetPassword: {
            confirmation_code: {
              label: '確認コード',
              placeholder: '確認コードを入力',
              isRequired: true,
            },
            password: {
              label: '新しいパスワード',
              placeholder: '新しいパスワードを入力',
              isRequired: true,
            },
            confirm_password: {
              label: 'パスワード（確認）',
              placeholder: 'パスワードを再入力',
              isRequired: true,
            }
          }
        }}
        components={{
          Header() {
            return (
              <div style={{
                textAlign: 'center',
                padding: '30px 20px 20px',
              }}>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  marginBottom: '10px',
                  letterSpacing: '2px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
                }}>
                  ログイン
                </h1>
                <p style={{
                  fontSize: '14px',
                  color: '#e5e7eb',
                  marginTop: '10px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  メモ機能を利用するにはアカウント登録が必要です
                </p>
              </div>
            );
          },
          Footer() {
            return (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                fontSize: '12px',
                color: '#d1d5db',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}>
                <p style={{ marginBottom: '5px' }}>
                  ※ メモ機能を使用するにはログインが必要です
                </p>
                <p style={{ marginBottom: '5px' }}>
                  パスワードをお忘れの場合は「パスワードをお忘れの方」から
                </p>
                <p>
                  リセット用のコードをメールで受け取れます
                </p>
              </div>
            );
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
        }}
        services={{
          async validateCustomSignUp(formData) {
            if (!formData.password || formData.password.length < 6) {
              return {
                password: 'パスワードは6文字以上で入力してください'
              };
            }
          }
        }}
      >
        {({ signOut, user }) => (
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