import { Amplify } from 'aws-amplify';
import config from '../../amplify_outputs.json';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Amplify設定を初期化
Amplify.configure(config);

// クライアントを生成
export const client = generateClient<Schema>({
  authMode: 'apiKey'
});