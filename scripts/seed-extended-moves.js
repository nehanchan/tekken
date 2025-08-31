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

async function seedExtendedMoves() {
  console.log('拡張技データ投入開始...');

  try {
    // 技分類を取得
    const { data: categories } = await client.models.MoveCategory.list();
    const validCategories = categories.filter(c => c !== null);
    const categoryMap = {};
    validCategories.forEach(cat => {
      categoryMap[cat.categoryName] = cat.id;
    });

    // 既存の技を削除
    const { data: existingMoves } = await client.models.Move.list();
    for (const move of existingMoves.filter(m => m !== null)) {
      await client.models.Move.delete({ id: move.id });
    }

    // 風間仁の拡張技データ
    const jinMoves = [
      {
        moveId: "00001",
        characterMoveId: 1,
        characterId: "001",
        categoryId: categoryMap["打撃技"],
        name: "左ジャブ",
        nameKana: "ヒダリジャブ",
        command: "1",
        damage: 7,
        judgment: "上段",
        startupFrame: 10,
        activeFrame: "2",
        hitFrame: "+1",
        blockFrame: "-1",
        attribute: "上段",
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
        command: "2",
        damage: 10,
        judgment: "上段",
        startupFrame: 12,
        activeFrame: "2",
        hitFrame: "+3",
        blockFrame: "-3",
        attribute: "上段",
        effects: [],
        notes: ["基本のパンチ", "ヒット時有利"]
      },
      {
        moveId: "00003",
        characterMoveId: 3,
        characterId: "001",
        categoryId: categoryMap["打撃技"],
        name: "風神拳",
        nameKana: "フウジンケン",
        command: "→↓↘+2",
        damage: 25,
        judgment: "上段",
        startupFrame: 14,
        activeFrame: "1",
        hitFrame: "+8",
        blockFrame: "+5",
        attribute: "上段",
        effects: [],
        notes: ["カウンターヒット時浮き", "確定反撃なし", "最速風神拳は13フレーム"]
      }
    ];

    for (const move of jinMoves) {
      await client.models.Move.create(move);
      console.log(`✓ ${move.name} 作成完了`);
    }

    console.log('拡張技データ投入完了！');
    console.log(`風間仁: ${jinMoves.length}件`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

seedExtendedMoves();