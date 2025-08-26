import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Character: a
    .model({
      name: a.string().required(),
      fightingStyle: a.string(),
      country: a.string(),
      height: a.integer(),
      weight: a.integer(),
      description: a.string(),
      imageUrl: a.string(),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  Move: a
    .model({
      name: a.string().required(),
      command: a.string().required(),
      damage: a.integer(),
      startupFrame: a.integer(),
      blockFrame: a.string(),
      hitFrame: a.string(),
      // 日本語 → 英語に変更
      moveType: a.enum(['HIGH', 'MID', 'LOW', 'THROW', 'SPECIAL']),
      element: a.enum(['NORMAL', 'SPECIAL', 'ULTIMATE']),
      description: a.string(),
      iconId: a.string(),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  Post: a
    .model({
      title: a.string().required(),
      content: a.string().required(),
      author: a.string().required(),
      characterId: a.id(),
      likes: a.integer().default(0),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});