// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({

  // キャラクターマスタ（height/weight文字列対応版）
  Character: a
    .model({
      character_id: a.string().required(),
      character_name_en: a.string().required(),
      character_name_jp: a.string(),
      display_name: a.string(),
      nickname: a.string(),
      height: a.string(),
      weight: a.string(),
      nationality: a.string(),
      martial_arts: a.string(),
      character_description: a.string(),
      
      moves: a.hasMany('Move', 'character_id'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // 技分類マスタ（更新版）
  MoveCategory: a
    .model({
      move_category_id: a.string().required(),
      move_category: a.string().required(),
      
      moves: a.hasMany('Move', 'move_category_id'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // 効果マスタ
  Effect: a
    .model({
      effect_id: a.id(),
      image_path: a.string().required(),
      effect_description: a.string().required(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // 技マスタ
  Move: a
    .model({
      move_id: a.string().required(),
      move_num: a.integer(),
      character_id: a.string().required(),
      move_category_id: a.string(),
      move_name: a.string().required(),
      move_name_kana: a.string(),
      command: a.string(),
      startup_frame: a.integer(),
      active_frame: a.string(),
      hit_frame: a.string(),
      block_frame: a.string(),
      attribute: a.string(),
      
      effects: a.string().array(),
      remarks: a.string().array(),
      
      character: a.belongsTo('Character', 'character_id'),
      category: a.belongsTo('MoveCategory', 'move_category_id'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // メモ（新規追加）
  Memo: a
    .model({
      character_id: a.string().required(),
      character_name: a.string(),
      categories: a.string().array(),
      title: a.string().required(),
      content: a.string(),
      importance: a.integer(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // コンボ
  Combo: a
    .model({
      character_id: a.string().required(),
      character_name: a.string(),
      title: a.string().required(),
      description: a.string(),
      difficulty: a.integer(), // 1~5
      damage: a.integer(),
      importance: a.integer(), // 1~5
      nodes: a.string().required(), // JSON文字列としてツリー構造を保存
      display_mode: a.string(), // 'move_name' | 'command'
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

// nodesフィールドに保存するJSON構造（オブジェクト形式）:
// {
//   "rootId": "node_xxxxx",
//   "nodes": {
//     "node_xxxxx": {
//       "id": "node_xxxxx",
//       "type": "move" | "freetext",
//       "moveId": "move_id_optional",
//       "moveName": "技名_optional",
//       "command": "コマンド_optional",
//       "freeText": "自由入力_optional",
//       "backgroundColor": "#ffffff",
//       "children": ["node_yyyyy", "node_zzzzz"]
//     },
//     "node_yyyyy": {
//       "id": "node_yyyyy",
//       ...
//     }
//   }
// }

  // 掲示板
  Post: a
    .model({
      title: a.string().required(),
      content: a.string().required(),
      author: a.string().required(),
      character_id: a.string(),
      likes: a.integer().default(0),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
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