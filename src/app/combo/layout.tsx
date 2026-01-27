'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { I18n } from 'aws-amplify/utils';

// 日本語翻訳
I18n.putVocabularies({
  ja: {
    'Sign In': 'ログイン',
    'Sign Up': '新規登録',
    'Sign Out': 'ログアウト',
    'Sign in': 'ログイン',
    'Sign up': '新規登録',
    'Forgot your password?': 'パスワードを忘れた方',
    'Reset Password': 'パスワードリセット',
    'Reset your password': 'パスワードをリセット',
    'Send code': '確認コードを送信',
    'Back to Sign In': 'ログイン画面に戻る',
    'Submit': '送信',
    'Enter your Email': 'メールアドレスを入力',
    'Enter your email': 'メールアドレスを入力',
    'Enter your Password': 'パスワードを入力',
    'Enter your password': 'パスワードを入力',
    'Please confirm your Password': 'パスワードを再入力',
    'Confirm Password': 'パスワード（確認）',
    'Email': 'メールアドレス',
    'Password': 'パスワード',
    'Code': '確認コード',
    'New Password': '新しいパスワード',
    'Confirm your account': 'アカウントを確認',
    'Confirmation Code': '確認コード',
    'Lost your code?': 'コードが届かない方',
    'Resend Code': 'コードを再送信',
    'Confirm': '確認',
    'We Emailed You': 'メールを送信しました',
    'Your code is on the way. To log in, enter the code we emailed to': '確認コードを送信しました。以下のメールアドレスに届いたコードを入力してください：',
    'It may take a minute to arrive.': 'メールが届くまで数分かかる場合があります。',
    'Account recovery requires verified contact information': 'パスワードリセットにはメールアドレスが必要です',
    'User does not exist.': 'ユーザーが存在しません',
    'Incorrect username or password.': 'メールアドレスまたはパスワードが正しくありません',
    'User already exists': 'このメールアドレスは既に登録されています',
    'Invalid verification code provided, please try again.': '確認コードが正しくありません。もう一度お試しください',
    'Invalid password format': 'パスワードの形式が正しくありません',
    'Password must have at least 8 characters': 'パスワードは8文字以上で入力してください',
    'Password must have uppercase letters': 'パスワードには大文字を含めてください',
    'Password must have lowercase letters': 'パスワードには小文字を含めてください',
    'Password must have numbers': 'パスワードには数字を含めてください',
    'An account with the given email already exists.': 'このメールアドレスは既に使用されています',
  },
});

I18n.setLanguage('ja');

export default function ComboLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator
      formFields={{
        signUp: {
          email: {
            order: 1,
            placeholder: 'example@email.com',
            label: 'メールアドレス',
            isRequired: true,
          },
          password: {
            order: 2,
            placeholder: '8文字以上（大文字・小文字・数字を含む）',
            label: 'パスワード',
            isRequired: true,
          },
          confirm_password: {
            order: 3,
            placeholder: 'パスワードを再入力',
            label: 'パスワード（確認）',
            isRequired: true,
          },
        },
        signIn: {
          username: {
            placeholder: 'example@email.com',
            label: 'メールアドレス',
            isRequired: true,
          },
          password: {
            placeholder: 'パスワードを入力',
            label: 'パスワード',
            isRequired: true,
          },
        },
        forgotPassword: {
          username: {
            placeholder: 'example@email.com',
            label: 'メールアドレス',
          },
        },
        confirmResetPassword: {
          confirmation_code: {
            placeholder: 'メールに届いた確認コードを入力',
            label: '確認コード',
          },
          password: {
            placeholder: '新しいパスワード（8文字以上）',
            label: '新しいパスワード',
          },
          confirm_password: {
            placeholder: '新しいパスワードを再入力',
            label: 'パスワード（確認）',
          },
        },
      }}
      components={{
        Header() {
          return (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#dc2626'
            }}>
              TEKKEN 8 データベース - コンボ機能
            </div>
          );
        },
        Footer() {
          return (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <p>※コンボ機能を使用するにはログインが必要です</p>
              <p>パスワードを忘れた場合は「パスワードを忘れた方」から</p>
              <p>リセット用のコードをメールで受け取れます</p>
            </div>
          );
        },
      }}
    >
      {children}
    </Authenticator>
  );
}
