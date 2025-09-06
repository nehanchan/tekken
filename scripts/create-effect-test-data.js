// scripts/create-effect-test-data.js
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

// エフェクト動作確認用のテスト技データ
const TEST_MOVES_WITH_EFFECTS = [
  {
    moveId: "TEST001",
    characterMoveId: 101,
    characterId: "001",
    categoryId: null, // 後で設定
    name: "エフェクトテスト技1",
    nameKana: "エフェクトテストワザ1",
    command: "lp",
    startupFrame: 10,
    activeFrame: "2",
    hitFrame: "+1",
    blockFrame: "-1",
    attribute: "上段",
    judgment: "上段",
    effects: ["1", "3"], // ホーミング + パワークラッシュ
    notes: ["エフェクト動作確認用", "ホーミング・パワークラッシュ効果"]
  },
  {
    moveId: "TEST002",
    characterMoveId: 102,
    characterId: "001",
    categoryId: null,
    name: "エフェクトテスト技2",
    nameKana: "エフェクトテストワザ2",
    command: "rp",
    startupFrame: 12,
    activeFrame: "2",
    hitFrame: "+3",
    blockFrame: "-3",
    attribute: "上段",
    judgment: "上段",
    effects: ["2", "5"], // トルネード誘発 + ヒート発動技
    notes: ["エフェクト動作確認用", "トルネード・ヒート効果"]
  },
  {
    moveId: "TEST003",
    characterMoveId: 103,
    characterId: "001",
    categoryId: null,
    name: "エフェクトテスト技3",
    nameKana: "エフェクトテストワザ3",
    command: "lk",
    startupFrame: 14,
    activeFrame: "3",
    hitFrame: "+5",
    blockFrame: "-8",
    attribute: "中段",
    judgment: "中段",
    effects: ["4", "6", "7"], // 回復ゲージ消滅 + ウォールブレイク + フロアブレイク
    notes: ["エフェクト動作確認用", "ゲージ消滅・壁床破壊効果"]
  },
  {
    moveId: "TEST004",
    characterMoveId: 104,
    characterId: "001",
    categoryId: null,
    name: "エフェクトテスト技4",
    nameKana: "エフェクトテストワザ4",
    command: "rk",
    startupFrame: 16,
    activeFrame: "2",
    hitFrame: "ダウン",
    blockFrame: "-13",
    attribute: "中段",
    judgment: "中段",
    effects: ["8"], // 強制しゃがみ
    notes: ["エフェクト動作確認用", "強制しゃがみ効果"]
  },
  {
    moveId: "TEST005",
    characterMoveId: 105,
    characterId: "001",
    categoryId: null,
    name: "全エフェクトテスト技",
    nameKana: "ゼンエフェクトテストワザ",
    command: "fontcrfcrp",
    startupFrame: 20,
    activeFrame: "1",
    hitFrame: "特殊",
    blockFrame: "特殊",
    attribute: "特殊",
    judgment: "特殊",
    effects: ["1", "2", "3", "4", "5", "6", "7", "8"], // 全エフェクト
    notes: ["エフェクト動作確認用", "全エフェクト搭載技", "表示テスト用"]
  }
];

async function createEffectTestData() {
  console.log('エフェクト動作確認用テストデータ作成開始...');

  try {
    // 1. 技分類取得
    const { data: categories } = await client.models.MoveCategory.list({ authMode: 'apiKey' });
    const validCategories = (categories || []).filter(c => c !== null);
    
    let testCategoryId = null;
    if (validCategories.length > 0) {
      // 最初の技分類を使用
      testCategoryId = validCategories[0].id;
      console.log(`技分類ID設定: ${testCategoryId} (${validCategories[0].categoryName})`);
    }

    // 2. 既存のテストデータを削除
    const { data: existingMoves } = await client.models.Move.list({ authMode: 'apiKey' });
    const testMoves = (existingMoves || []).filter(m => m !== null && m.moveId && m.moveId.startsWith('TEST'));
    
    if (testMoves.length > 0) {
      console.log(`既存テストデータ ${testMoves.length} 件を削除中...`);
      for (const move of testMoves) {
        await client.models.Move.delete({ id: move.id });
      }
      console.log('既存テストデータ削除完了');
    }

    // 3. 新しいテストデータを作成
    console.log('新しいテストデータを作成中...');
    
    for (const moveData of TEST_MOVES_WITH_EFFECTS) {
      try {
        const moveWithCategory = {
          ...moveData,
          categoryId: testCategoryId
        };
        
        const result = await client.models.Move.create(moveWithCategory);
        console.log(`✓ テスト技作成: ${moveData.name} (エフェクト: ${moveData.effects.join(', ')})`);
      } catch (error) {
        console.error(`❌ テスト技作成失敗: ${moveData.name} - ${error.message}`);
      }
    }

    // 4. 作成結果確認
    const { data: newMoves } = await client.models.Move.list({
      filter: { characterId: { eq: "001" } },
      authMode: 'apiKey'
    });
    
    const jinMoves = (newMoves || []).filter(m => m !== null && m.characterId === "001");
    const testMovesCreated = jinMoves.filter(m => m.moveId && m.moveId.startsWith('TEST'));
    
    console.log('\n=== 作成完了 ===');
    console.log(`風間仁の総技数: ${jinMoves.length}技`);
    console.log(`テスト技数: ${testMovesCreated.length}技`);
    
    console.log('\n=== テスト技一覧 ===');
    testMovesCreated.forEach(move => {
      console.log(`${move.name}: エフェクト[${move.effects ? move.effects.join(', ') : 'なし'}]`);
    });

    console.log('\n🎉 エフェクトテストデータ作成完了！');
    console.log('\n次の手順:');
    console.log('1. ブラウザで /character/001 にアクセス');
    console.log('2. 技一覧でエフェクトアイコンが表示されることを確認');
    console.log('3. アイコンにホバーして詳細説明が表示されることを確認');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

createEffectTestData();