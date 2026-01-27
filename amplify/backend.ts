import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  data,
});

// Cognitoのパスワードポリシーをカスタマイズ
// CFNレベルでアクセスする必要があります
const { cfnUserPool } = backend.auth.resources.cfnResources;

cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 6,
    requireLowercase: false,
    requireUppercase: false,
    requireNumbers: false,
    requireSymbols: false,
  },
};
