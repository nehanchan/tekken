import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFile } from 'fs/promises';

const outputs = JSON.parse(await readFile('./amplify_outputs.json', 'utf8'));

// API Key認証モードで設定
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

async function seedMasterData() {
  console.log('マスタデータ投入開始...');

  try {
    // 1. 技分類マスタ投入
    console.log('技分類マスタ投入中...');
    const categories = [
      { categoryName: "打撃技" },
      { categoryName: "投げ技" },
      { categoryName: "特殊技" },
      { categoryName: "必殺技" },
      { categoryName: "コンボ技" },
      { categoryName: "カウンター技" }
    ];

    const createdCategories = {};
    for (const category of categories) {
      const result = await client.models.MoveCategory.create(category);
      createdCategories[category.categoryName] = result.data.id;
      console.log(`✓ ${category.categoryName} 作成完了`);
    }

    // 2. 効果マスタ投入
    console.log('効果マスタ投入中...');
    const effects = [
      { imagePath: "/icons/launcher.png" },
      { imagePath: "/icons/counter_hit.png" },
      { imagePath: "/icons/wall_bounce.png" },
      { imagePath: "/icons/floor_break.png" },
      { imagePath: "/icons/screw.png" }
    ];

    const createdEffects = [];
    for (const effect of effects) {
      const result = await client.models.Effect.create(effect);
      createdEffects.push(result.data.id);
      console.log(`✓ 効果 ${effect.imagePath} 作成完了`);
    }

    // 3. キャラクターマスタ投入
    console.log('キャラクターマスタ投入中...');
    const characters = [
      {
        characterId: "001",
        name: "風間仁",
        nameKana: "カザマジン",
        title: "悪魔の血を宿す者",
        height: 180,
        weight: 75,
        nationality: "日本",
        description: "風間財閥の跡取り息子。悪魔の血を宿し、常に内なる悪魔と戦い続けている。正義感は強いが、その力をコントロールすることに苦悩している。"
      },
      {
        characterId: "002",
        name: "三島一八",
        nameKana: "ミシマカズヤ",
        title: "三島財閥総帥",
        height: 181,
        weight: 76,
        nationality: "日本",
        description: "三島財閥の総帥にして、デビル遺伝子を持つ男。父・平八への復讐と世界征服を目論む冷酷な野心家。"
      },
      {
        characterId: "003",
        name: "ポール・フェニックス",
        nameKana: "ポール・フェニックス",
        title: "熱血格闘家",
        height: 187,
        weight: 78,
        nationality: "アメリカ",
        description: "宇宙一の格闘家を目指すアメリカの熱血漢。決して諦めない精神力と、破天荒な性格が持ち味。"
      }
    ];

    for (const character of characters) {
      await client.models.Character.create(character);
      console.log(`✓ ${character.name} 作成完了`);
    }

    // 4. 技マスタ投入（風間仁の技）
    console.log('技マスタ投入中（風間仁）...');
    const jinMoves = [
      {
        moveId: "00001",
        characterMoveId: 1,
        characterId: "001",
        categoryId: createdCategories["打撃技"],
        name: "風神拳",
        nameKana: "フウジンケン",
        startupFrame: 14,
        activeFrame: "1",
        hitFrame: "+8",
        blockFrame: "+5",
        attribute: "上段",
        effects: [createdEffects[0]],
        notes: ["カウンターヒット時浮き", "確定反撃なし", "最速風神拳は13フレーム"]
      },
      {
        moveId: "00002",
        characterMoveId: 2,
        characterId: "001",
        categoryId: createdCategories["打撃技"],
        name: "左アッパー",
        nameKana: "ヒダリアッパー",
        startupFrame: 10,
        activeFrame: "2",
        hitFrame: "+1",
        blockFrame: "-9",
        attribute: "上段",
        effects: [],
        notes: ["発生の速いジャブ", "ガードされると不利"]
      },
      {
        moveId: "00003",
        characterMoveId: 3,
        characterId: "001",
        categoryId: createdCategories["投げ技"],
        name: "胴抜き",
        nameKana: "ドウヌキ",
        startupFrame: 12,
        activeFrame: "2",
        hitFrame: "投げ",
        blockFrame: "投げ",
        attribute: "投げ",
        effects: [],
        notes: ["前投げ", "受け身可能"]
      }
    ];

    for (const move of jinMoves) {
      await client.models.Move.create(move);
      console.log(`✓ ${move.name} 作成完了`);
    }

    console.log('🎉 全マスタデータ投入完了！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

seedMasterData();