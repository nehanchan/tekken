// scripts/quick-fix-moves.js
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

async function quickFixMoves() {
  console.log('技データ緊急修復開始...');

  try {
    // 1. 技分類を取得
    const { data: categories } = await client.models.MoveCategory.list();
    const validCategories = categories.filter(c => c !== null);
    const categoryMap = {};
    validCategories.forEach(cat => {
      categoryMap[cat.categoryName] = cat.id;
    });

    console.log('技分類マップ:', categoryMap);

    // 2. 既存の技を確認
    const { data: existingMoves } = await client.models.Move.list();
    const validExistingMoves = existingMoves.filter(m => m !== null);
    console.log(`既存技数: ${validExistingMoves.length}`);

    // 3. 風間仁の基本技を追加（存在しない場合）
    const basicMoves = [
      {
        moveId: "00001",
        characterMoveId: 1,
        characterId: "001",
        categoryId: categoryMap["打撃技"],
        name: "左ジャブ",
        nameKana: "ヒダリジャブ",
        command: "lp",
        damage: 7,
        startupFrame: 10,
        activeFrame: "2",
        hitFrame: "+1",
        blockFrame: "-1",
        attribute: "上段",
        judgment: "上段",
        effects: [],
        notes: ["発生の速い基本技", "連携の起点"]
      },
      {
        moveId: "00002",
        characterMoveId: 2,
        characterId: "001",
        categoryId: categoryMap["打撃技"],
        name: "右ストレート",
        nameKana: "ミギストレート",
        command: "rp",
        damage: 10,
        startupFrame: 12,
        activeFrame: "2",
        hitFrame: "+3",
        blockFrame: "-3",
        attribute: "上段",
        judgment: "上段",
        effects: [],
        notes: ["基本のパンチ", "ヒット時有利"]
      },
      {
        moveId: "00003",
        characterMoveId: 3,
        characterId: "001",
        categoryId: categoryMap["必殺技"],
        name: "風神拳",
        nameKana: "フウジンケン",
        command: "fontcrfcrp",
        damage: 25,
        startupFrame: 14,
        activeFrame: "1",
        hitFrame: "+8",
        blockFrame: "+5",
        attribute: "上段",
        judgment: "上段",
        effects: [],
        notes: ["カウンターヒット時浮き", "確定反撃なし", "最速風神拳は13フレーム"]
      },
      {
        moveId: "00004",
        characterMoveId: 4,
        characterId: "001",
        categoryId: categoryMap["投げ技"],
        name: "胴抜き",
        nameKana: "ドウヌキ",
        command: "wl",
        damage: 35,
        startupFrame: 12,
        activeFrame: "2",
        hitFrame: "投げ",
        blockFrame: "投げ",
        attribute: "投げ",
        judgment: "投げ",
        effects: [],
        notes: ["前投げ", "受け身可能"]
      }
    ];

    // 4. 技を追加
    for (const moveData of basicMoves) {
      try {
        // 既存チェック
        const existing = validExistingMoves.find(m => 
          m.moveId === moveData.moveId && m.characterId === moveData.characterId
        );

        if (existing) {
          console.log(`✓ ${moveData.name} は既に存在します`);
          continue;
        }

        const result = await client.models.Move.create(moveData);
        console.log(`✓ ${moveData.name} を作成しました (ID: ${result.data?.id})`);
        
      } catch (error) {
        console.error(`❌ ${moveData.name} の作成に失敗:`, error.message);
      }
    }

    // 5. 結果確認
    const { data: finalMoves } = await client.models.Move.list({
      filter: { characterId: { eq: "001" } }
    });
    const validFinalMoves = finalMoves.filter(m => m !== null);
    
    console.log(`\n風間仁の技数: ${validFinalMoves.length}`);
    validFinalMoves.forEach(move => {
      const category = validCategories.find(c => c.id === move.categoryId);
      console.log(`- ${move.name} (${category?.categoryName || '未分類'})`);
    });

    console.log('\n🎉 修復完了！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

quickFixMoves();