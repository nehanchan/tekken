import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'nehanchanStorage',
  access: (allow) => ({
    'character-images/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
    'move-icons/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
  }),
});