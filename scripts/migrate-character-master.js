// scripts/migrate-character-master.js
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFile } from 'fs/promises';

const outputs = JSON.parse(await readFile('./amplify_outputs.json', 'utf8'));

Amplify.configure(outputs, {
  API: {
    GraphQL: {
      defaultAuthorizationMode: 'apiKey'
    }
  }
});

const client = generateClient({
  authMode: 'apiKey'
});

// 既存データから新しいフィールド構造への移行マッピング
const CHARACTER_MIGRATION_DATA = [
  {
    // 既存データ参照用
    oldCharacterId: "001",
    // 新しいフィールド構造
    character_id: "001",
    character_name_en: "Jin Kazama",
    character_name_jp: "風間 仁",
    nickname: "悪魔の血を宿す者",
    height: 180,
    weight: 75,
    nationality: "日本",
    martial_arts: "三島流空手",
    character_description: "風間財閥の跡取り息子。悪魔の血を宿し、常に内なる悪魔と戦い続けている。正義感は強いが、その力をコントロールすることに苦悩している。"
  },
  {
    oldCharacterId: "002", 
    character_id: "002",
    character_name_en: "Kazuya Mishima",
    character_name_jp: "三島 一八",
    nickname: "三島財閥総帥",
    height: 181,
    weight: 76,
    nationality: "日本",
    martial_arts: "三島流空手",
    character_description: "三島財閥の総帥にして、デビル遺伝子を持つ男。父・平八への復讐と世界征服を目論む冷酷な野心家。"
  },
  {
    oldCharacterId: "003",
    character_id: "003", 
    character_name_en: "Paul Phoenix",
    character_name_jp: "ポール・フェニックス",
    nickname: "熱血格闘家",
    height: 187,
    weight: 78,
    nationality: "アメリカ",
    martial_arts: "柔道",
    character_description: "宇宙一の格闘家を目指すアメリカの熱血漢。決して諦めない精神力と、破天荒な性格が持ち味。"
  },
  // 追加キャラクター（必要に応じて拡張）
  {
    oldCharacterId: "380",
    character_id: "380",
    character_name_en: "Unknown Character",
    character_name_jp: "不明キャラクター",
    nickname: "テストキャラクター",
    height: 175,
    weight: 70,
    nationality: "不明",
    martial_arts: "不明",
    character_description: "テスト用キャラクターデータ"
  }
];

async function migrateCharacterMaster() {
  console.log('キャラクターマスタ移行開始...');

  try {
    // 1. 既存キャラクターデータを確認
    console.log('既存データ確認中...');
    const { data: existingCharacters } = await client.models.Character.list({ authMode: 'apiKey' });
    const validExistingCharacters = (existingCharacters || []).filter(c => c !== null);
    
    console.log(`既存キャラクター数: ${validExistingCharacters.length}`);
    validExistingCharacters.forEach(char => {
      console.log(`  - ${char.characterId || char.character_id}: ${char.name || char.character_name_en}`);
    });

    // 2. 既存データのバックアップ情報表示
    console.log('\n既存データのフィールド構造確認:');
    if (validExistingCharacters.length > 0) {
      const sampleChar = validExistingCharacters[0];
      console.log('サンプルデータのフィールド:', Object.keys(sampleChar));
    }

    // 3. 新しい構造でキャラクターデータを作成
    console.log('\n新しい構造でキャラクターデータを作成中...');
    
    // ※注意: スキーマ変更後は既存のCharacterモデルは使用できないため、
    // 実際の移行はスキーマデプロイ後に手動で行う必要があります
    
    for (const charData of CHARACTER_MIGRATION_DATA) {
      try {
        // 新しいスキーマでの作成例（実際はスキーマ更新後に実行）
        console.log(`準備完了: ${charData.character_name_en} (${charData.character_id})`);
        console.log(`  英語名: ${charData.character_name_en}`);
        console.log(`  日本語名: ${charData.character_name_jp}`);
        console.log(`  ニックネーム: ${charData.nickname}`);
        console.log(`  格闘技: ${charData.martial_arts}`);
        console.log('');
      } catch (error) {
        console.error(`❌ ${charData.character_name_en} の準備でエラー:`, error.message);
      }
    }

    console.log('=== 移行準備完了 ===');
    console.log('次の手順:');
    console.log('1. amplify/data/resource.ts を新しいスキーマで更新');
    console.log('2. ampx sandbox または amplify deploy でスキーマをデプロイ');
    console.log('3. 新しいスキーマでキャラクターデータを再作成');
    console.log('4. 技データのcharacter_idフィールドも更新が必要');

  } catch (error) {
    console.error('移行処理でエラーが発生しました:', error);
  }
}

// 新しいスキーマでの実際のデータ作成関数（スキーマ更新後に使用）
async function createNewCharacterData() {
  console.log('新しいスキーマでキャラクターデータ作成中...');
  
  for (const charData of CHARACTER_MIGRATION_DATA) {
    try {
      const { oldCharacterId, ...newCharData } = charData;
      
      // 新しいスキーマでキャラクター作成
      const result = await client.models.Character.create(newCharData);
      console.log(`✓ ${charData.character_name_en} 作成完了`);
    } catch (error) {
      console.error(`❌ ${charData.character_name_en} 作成失敗:`, error.message);
    }
  }
}

// コマンドライン引数で実行モードを選択
const args = process.argv.slice(2);
const mode = args[0] || 'prepare';

if (mode === 'create') {
  createNewCharacterData();
} else {
  migrateCharacterMaster();
}