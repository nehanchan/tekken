// scripts/update-move-commands.js
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFile } from 'fs/promises';

const outputs = JSON.parse(await readFile('./amplify_outputs.json', 'utf8'));

Amplify.configure(outputs, {
  API: {
    GraphQL: {
      defaultAuthMode: 'apiKey'
    }
  }
});

const client = generateClient({
  authMode: 'apiKey'
});

// 技データの更新情報
const moveUpdates = {
  // 風間仁の技データ更新
  '001': [
    {
      moveId: "00001", // 風神拳
      updates: {
        command: "crfcrp",
        damage: 25,
        judgment: "上段",
        notes: ["カウンターヒット時浮き", "確定反撃なし", "最速風神拳は13フレーム"]
      }
    },
    {
      moveId: "00002", // 左ジャブ
      updates: {
        command: "lp",
        damage: 7,
        judgment: "上段",
        notes: ["発生の速い基本技", "連携の起点"]
      }
    },
    {
      moveId: "00003", // 右ストレート
      updates: {
        command: "rp",
        damage: 10,
        judgment: "上段",
        notes: ["基本のパンチ", "ヒット時有利"]
      }
    }
  ]
};

// 新規技データの追加
const newMoves = {
  '001': [ // 風間仁
    {
      moveId: "00004",
      characterMoveId: 4,
      characterId: "001",
      categoryId: null, // 後で技分類IDを設定
      name: "左キック",
      nameKana: "ヒダリキック",
      command: "lk",
      damage: 12,
      startupFrame: 10,
      activeFrame: "3",
      hitFrame: "+3",
      blockFrame: "-6",
      attribute: "上段",
      judgment: "上段",
      effects: [],
      notes: ["基本の蹴り技", "リーチが長い"]
    },
    {
      moveId: "00005",
      characterMoveId: 5,
      characterId: "001",
      categoryId: null,
      name: "右ミドルキック",
      nameKana: "ミギミドルキック",
      command: "rk",
      damage: 15,
      startupFrame: 12,
      activeFrame: "2",
      hitFrame: "+5",
      blockFrame: "-8",
      attribute: "中段",
      judgment: "中段",
      effects: [],
      notes: ["中段攻撃", "ガード時大きく不利"]
    },
    {
      moveId: "00006",
      characterMoveId: 6,
      characterId: "001",
      categoryId: null,
      name: "鬼八門",
      nameKana: "オニハチモン",
      command: "fontcrp",
      damage: 30,
      startupFrame: 16,
      activeFrame: "1",
      hitFrame: "ダウン",
      blockFrame: "-13",
      attribute: "中段",
      judgment: "中段",
      effects: [],
      notes: ["強力な中段技", "ガード時確定反撃あり", "ヒット時ダウン"]
    }
  ]
};

async function updateMoveCommands() {
  console.log('技データ更新開始...');

  try {
    // 1. 技分類IDを取得
    const { data: categories } = await client.models.MoveCategory.list();
    const validCategories = categories.filter(c => c !== null);
    const categoryMap = {};
    validCategories.forEach(cat => {
      categoryMap[cat.categoryName] = cat.id;
    });

    console.log('技分類マップ:', categoryMap);

    // 2. 既存技データの更新
    for (const [characterId, updates] of Object.entries(moveUpdates)) {
      console.log(`\n=== ${characterId}キャラクターの技更新 ===`);
      
      for (const updateData of updates) {
        // moveIdで検索して更新
        const { data: existingMoves } = await client.models.Move.list({
          filter: {
            and: [
              { characterId: { eq: characterId } },
              { moveId: { eq: updateData.moveId } }
            ]
          }
        });

        const validMoves = existingMoves.filter(m => m !== null);
        
        if (validMoves.length > 0) {
          const move = validMoves[0];
          const updatedMove = await client.models.Move.update({
            id: move.id,
            ...updateData.updates
          });
          
          console.log(`✓ ${updateData.moveId} (${updatedMove.data?.name}) 更新完了`);
        } else {
          console.log(`⚠ ${updateData.moveId} が見つかりません`);
        }
      }
    }

    // 3. 新規技データの追加
    for (const [characterId, moves] of Object.entries(newMoves)) {
      console.log(`\n=== ${characterId}キャラクターの新規技追加 ===`);
      
      for (const moveData of moves) {
        // デフォルトで打撃技カテゴリを設定
        const moveWithCategory = {
          ...moveData,
          categoryId: categoryMap["打撃技"] || null
        };

        try {
          const newMove = await client.models.Move.create(moveWithCategory);
          console.log(`✓ ${moveData.name} (${moveData.moveId}) 追加完了`);
        } catch (error) {
          console.log(`❌ ${moveData.name} 追加失敗:`, error.message);
        }
      }
    }

    // 4. 更新結果の確認
    console.log('\n=== 更新結果確認 ===');
    const { data: allMoves } = await client.models.Move.list({
      filter: { characterId: { eq: "001" } }
    });
    
    const validAllMoves = allMoves.filter(m => m !== null);
    console.log(`風間仁の技数: ${validAllMoves.length}個`);
    
    validAllMoves.forEach(move => {
      console.log(`- ${move.name}: ${move.command || 'コマンドなし'}`);
    });

    console.log('\n🎉 技データ更新完了！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

updateMoveCommands();