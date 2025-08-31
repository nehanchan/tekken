import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // キャラクターマスタ
  Character: a
    .model({
      characterId: a.string().required(),  // "001", "002" 形式
      name: a.string().required(),         // キャラクター名 (64文字)
      nameKana: a.string(),               // キャラクター名カナ (64文字)
      title: a.string(),                  // キャラクター称号名 (64文字)
      height: a.integer(),                // 身長 (5桁数値)
      weight: a.integer(),                // 体重 (5桁数値)
      nationality: a.string(),            // 国籍 (32文字)
      description: a.string(),            // 紹介文 (1024文字)
      
      moves: a.hasMany('Move', 'characterId'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // 技分類マスタ
  MoveCategory: a
    .model({
      categoryId: a.id(),                  // ユニークキー
      categoryName: a.string().required(), // 技分類（32文字）
      
      moves: a.hasMany('Move', 'categoryId'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // 効果マスタ
  Effect: a
    .model({
      effectId: a.id(),
      imagePath: a.string().required(),   // 画像パス (256文字)
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // 技マスタ
  Move: a
  .model({
    moveId: a.string().required(),       // No
    characterMoveId: a.integer(),        
    characterId: a.string().required(),  
    categoryId: a.id(),                  
    name: a.string().required(),         // 技名
    nameKana: a.string(),               
    command: a.string(),                 // コマンド（追加）
    damage: a.integer(),                 // ダメージ（追加）
    startupFrame: a.integer(),           // 発生F
    activeFrame: a.string(),             // 持続F 
    hitFrame: a.string(),                // ヒット時硬直差
    blockFrame: a.string(),              // ガード時硬直差
    attribute: a.string(),               // 属性
    judgment: a.string(),                // 判定（追加）
    
    effects: a.string().array(),         
    notes: a.string().array(),           // 備考
    
    character: a.belongsTo('Character', 'characterId'),
    category: a.belongsTo('MoveCategory', 'categoryId'),
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
      characterId: a.string(),
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