import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

const outputs = JSON.parse(await readFile('./amplify_outputs.json', 'utf8'));

Amplify.configure(outputs, {
  API: {
    GraphQL: {
      defaultAuthMode: 'apiKey',
    },
  },
});

const client = generateClient({ authMode: 'apiKey' });

/* ===============================
 * 定義
 * =============================== */

const CHARACTER_FIELD_MAPPING = {
  character_id: 'character_id',
  character_name_en: 'character_name_en',
  character_name_jp: 'character_name_jp',
  nickname: 'nickname',
  height: 'height',
  weight: 'weight',
  nationality: 'nationality',
  martial_arts: 'martial_arts',
  character_description: 'character_description',
};

const EXPECTED_HEADERS = Object.keys(CHARACTER_FIELD_MAPPING);

/* ===============================
 * ユーティリティ
 * =============================== */

const stringOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = value.toString().trim();
  return trimmed === '' ? null : trimmed;
};

/* ===============================
 * CSV インポート
 * =============================== */

async function importCharacterCSV(csvFilePath, options = {}) {
  const { replaceAll = false, dryRun = false } = options;

  console.log('キャラクターCSVインポート開始:', csvFilePath);
  console.log(`モード: ${replaceAll ? '全置換' : '追加'}, ${dryRun ? 'ドライラン' : '実行'}`);

  const { data: existing } = await client.models.Character.list();
  const existingCharacters = (existing || []).filter(Boolean);

  if (replaceAll && !dryRun) {
    for (const char of existingCharacters) {
      await client.models.Character.delete({ id: char.id });
      console.log(`削除: ${char.character_id}`);
    }
  }

  const csvData = [];
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  return new Promise((resolve, reject) => {
    createReadStream(csvFilePath, { encoding: 'utf8' })
      .pipe(parser)
      .on('data', (row) => csvData.push(row))
      .on('end', async () => {
        let success = 0;
        let skipped = 0;
        let error = 0;

        const existingMap = new Map();
        if (!replaceAll) {
          existingCharacters.forEach((c) =>
            existingMap.set(c.character_id, c)
          );
        }

        for (let i = 0; i < csvData.length; i++) {
          const row = csvData[i];
          const rowNumber = i + 2;

          try {
            if (!row.character_id || !row.character_name_en) {
              throw new Error('必須フィールド不足');
            }

            if (!replaceAll && existingMap.has(row.character_id)) {
              skipped++;
              console.log(`⚠ 行${rowNumber}: 重複IDのためスキップ`);
              continue;
            }

            const characterData = {
              character_id: stringOrNull(row.character_id),
              character_name_en: stringOrNull(row.character_name_en),
              character_name_jp: stringOrNull(row.character_name_jp),
              nickname: stringOrNull(row.nickname),

              // ★ 文字列として保存
              height: stringOrNull(row.height),
              weight: stringOrNull(row.weight),

              nationality: stringOrNull(row.nationality),
              martial_arts: stringOrNull(row.martial_arts),
              character_description: stringOrNull(row.character_description),
            };

            if (!dryRun) {
              await client.models.Character.create(characterData);
            }

            success++;
            console.log(`✓ 行${rowNumber}: ${characterData.character_id}`);

          } catch (e) {
            error++;
            console.error(`❌ 行${rowNumber}: ${e.message}`);
          }
        }

        console.log('\n=== 結果 ===');
        console.log(`成功: ${success}`);
        console.log(`スキップ: ${skipped}`);
        console.log(`エラー: ${error}`);

        resolve();
      })
      .on('error', reject);
  });
}

/* ===============================
 * CSV テンプレート
 * =============================== */

async function generateCharacterCSVTemplate() {
  console.log(EXPECTED_HEADERS.join(','));
  console.log(
    [
      '011',
      'Ryu Hayabusa',
      'リュウ・ハヤブサ',
      '竜の忍者',
      '175cm',
      '約70kg',
      '日本',
      '忍術',
      '古代より続く忍者の血筋を引く戦士',
    ].join(',')
  );
}

/* ===============================
 * CSV バリデーション
 * =============================== */

async function validateCharacterCSV(csvFilePath) {
  const csvData = [];
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  return new Promise((resolve, reject) => {
    createReadStream(csvFilePath, { encoding: 'utf8' })
      .pipe(parser)
      .on('data', (row) => csvData.push(row))
      .on('end', () => {
        let error = 0;

        const ids = new Set();
        csvData.forEach((row, i) => {
          const rowNumber = i + 2;
          const errors = [];

          if (!row.character_id) errors.push('character_id が空');
          if (!row.character_name_en) errors.push('character_name_en が空');

          if (ids.has(row.character_id)) {
            errors.push('character_id 重複');
          }
          ids.add(row.character_id);

          if (errors.length > 0) {
            error++;
            console.log(`❌ 行${rowNumber}: ${errors.join(', ')}`);
          }
        });

        console.log(`検証完了: エラー ${error} 件`);
        resolve();
      })
      .on('error', reject);
  });
}

/* ===============================
 * CLI
 * =============================== */

const args = process.argv.slice(2);
const command = args[0];
const csvFile = args[1];

const options = {
  replaceAll: args.includes('--replace-all'),
  dryRun: args.includes('--dry-run'),
};

switch (command) {
  case 'template':
    await generateCharacterCSVTemplate();
    break;

  case 'validate':
    await validateCharacterCSV(csvFile);
    break;

  case 'import':
    await importCharacterCSV(csvFile, options);
    break;

  default:
    console.log('Usage:');
    console.log('  template');
    console.log('  validate <csv>');
    console.log('  import <csv> [--replace-all] [--dry-run]');
}
