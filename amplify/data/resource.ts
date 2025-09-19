// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({

  // キャラクターマスタ（height/weight文字列対応版）
  Character: a
    .model({
      character_id: a.string().required(),        // "001", "002" 形式
      character_name_en: a.string().required(),   // 英語キャラクター名 (64文字)
      character_name_jp: a.string(),              // 日本語キャラクター名 (64文字)
      display_name: a.string(),                   // 表示名（優先表示用、64文字）
      nickname: a.string(),                       // ニックネーム・称号 (64文字)
      height: a.string(),                         // 身長（文字列）例: "180cm", "不明"
      weight: a.string(),                         // 体重（文字列）例: "75kg", "不明"
      nationality: a.string(),                    // 国籍 (32文字)
      martial_arts: a.string(),                   // 格闘技・流派 (32文字)
      character_description: a.string(),          // キャラクター説明 (1024文字)
      
      moves: a.hasMany('Move', 'character_id'),
    })    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // 技分類マスタ（更新版）
  MoveCategory: a
    .model({
      move_category_id: a.string().required(),    // カテゴリID（必須）
      move_category: a.string().required(),       // 技分類名（必須）
      
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
      image_path: a.string().required(),   // 画像パス (256文字)
      effect_description: a.string().required(), // 効果説明 (1024文字)
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // 技マスタ
  Move: a
    .model({
      move_id: a.string().required(),              // No
      move_num: a.integer(),        
      character_id: a.string().required(),        // characterId → character_id に変更
      move_category_id: a.string(),               // categoryId → move_category_id に変更
      move_name: a.string().required(),                // 技名
      move_name_kana: a.string(),               
      command: a.string(),                        // コマンド（追加）
      // damage: a.integer(),                        // ダメージ（追加）
      startup_frame: a.integer(),                  // 発生F
      active_frame: a.string(),                    // 持続F 
      hit_frame: a.string(),                       // ヒット時硬直差
      block_frame: a.string(),                     // ガード時硬直差
      attribute: a.string(),                      // 属性
      // judgment: a.string(),                       // 判定（追加）
      
      effects: a.string().array(),         
      remarks: a.string().array(),                  // 備考
      
      character: a.belongsTo('Character', 'character_id'),
      category: a.belongsTo('MoveCategory', 'move_category_id'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // 掲示板
  Post: a
    .model({
      title: a.string().required(),
      content: a.string().required(),
      author: a.string().required(),
      character_id: a.string(),  // characterId → character_id に変更
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