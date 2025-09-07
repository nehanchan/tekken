// scripts/import-character-csv.js
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

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

// CSVヘッダーとデータベースフィールドのマッピング
const CHARACTER_FIELD_MAPPING = {
  'character_id': 'character_id',
  'character_name_en': 'character_name_en',
  'character_name_jp': 'character_name_jp',
  'nickname': 'nickname',
  'height': 'height',
  'weight': 'weight',
  'nationality': 'nationality',
  'martial_arts': 'martial_arts',
  'character_description': 'character_description'
};

// 期待されるCSVヘッダー
const EXPECTED_HEADERS = Object.keys(CHARACTER_FIELD_MAPPING);

async function importCharacterCSV(csvFilePath, options = {}) {
  const { replaceAll = false, dryRun = false } = options;
  
  console.log('キャラクターCSVインポート開始:', csvFilePath);
  console.log(`モード: ${replaceAll ? '全置換' : '追加'}, ${dryRun ? 'ドライラン' : '実行'}`);
  
  try {
    // 1. 既存キャラクターデータの確認
    const { data: existingCharacters } = await client.models.Character.list({ authMode: 'apiKey' });
    const validExistingCharacters = (existingCharacters || []).filter(c => c !== null);
    
    console.log(`既存キャラクター数: ${validExistingCharacters.length}`);
    
    if (replaceAll && validExistingCharacters.length > 0) {
      console.log('全置換モード: 既存データを削除します');
      if (!dryRun) {
        for (const character of validExistingCharacters) {
          await client.models.Character.delete({ id: character.id });
          console.log(`  削除: ${character.character_id} - ${character.character_name_jp || character.character_name_en}`);
        }
      }
    }
    
    // 2. CSVファイルを読み込み
    const csvData = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true // BOM文字対応
    });
    
    const stream = createReadStream(csvFilePath, { encoding: 'utf8' });
    
    return new Promise((resolve, reject) => {
      stream.pipe(parser)
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', async () => {
          try {
            console.log(`CSVデータ読み込み完了: ${csvData.length}行`);
            
            if (csvData.length === 0) {
              console.log('CSVデータが空です');
              resolve();
              return;
            }
            
            // 3. ヘッダー検証
            const headers = Object.keys(csvData[0]);
            console.log('\n=== ヘッダー検証 ===');
            console.log('検出されたヘッダー:', headers);
            
            // 必須フィールドチェック
            const requiredFields = ['character_id', 'character_name_en'];
            const missingRequired = requiredFields.filter(field => !headers.includes(field));
            
            if (missingRequired.length > 0) {
              throw new Error(`必須フィールドが不足しています: ${missingRequired.join(', ')}`);
            }
            
            // 不明なフィールドの警告
            const unknownFields = headers.filter(header => !EXPECTED_HEADERS.includes(header));
            if (unknownFields.length > 0) {
              console.log('⚠ 不明なフィールド（無視されます）:', unknownFields);
            }
            
            console.log('✓ ヘッダー検証完了');
            
            // 4. データ処理
            console.log('\n=== データ処理 ===');
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            const errors = [];
            
            // 既存キャラクターマップ作成（追加モード用）
            const existingCharacterMap = new Map();
            if (!replaceAll) {
              validExistingCharacters.forEach(char => {
                existingCharacterMap.set(char.character_id, char);
              });
            }
            
            for (let i = 0; i < csvData.length; i++) {
              const row = csvData[i];
              const rowNumber = i + 2; // ヘッダー行を考慮
              
              try {
                // 必須フィールドチェック
                if (!row.character_id || !row.character_name_en) {
                  throw new Error(`必須フィールドが不足: character_id=${row.character_id}, character_name_en=${row.character_name_en}`);
                }
                
                // 重複チェック（追加モード時）
                if (!replaceAll && existingCharacterMap.has(row.character_id)) {
                  skippedCount++;
                  console.log(`⚠ 行${rowNumber}: キャラクターID "${row.character_id}" は既に存在するためスキップ`);
                  continue;
                }
                
                // 数値フィールドの変換
                const parseIntSafe = (value, fieldName) => {
                  if (!value || value.toString().trim() === '') return null;
                  const num = parseInt(value, 10);
                  if (isNaN(num) || num <= 0) {
                    throw new Error(`${fieldName}は正の整数である必要があります: ${value}`);
                  }
                  return num;
                };
                
                // キャラクターデータ作成
                const characterData = {
                  character_id: row.character_id.trim(),
                  character_name_en: row.character_name_en.trim(),
                  character_name_jp: row.character_name_jp ? row.character_name_jp.trim() : null,
                  nickname: row.nickname ? row.nickname.trim() : null,
                  height: parseIntSafe(row.height, '身長'),
                  weight: parseIntSafe(row.weight, '体重'),
                  nationality: row.nationality ? row.nationality.trim() : null,
                  martial_arts: row.martial_arts ? row.martial_arts.trim() : null,
                  character_description: row.character_description ? row.character_description.trim() : null
                };
                
                console.log(`処理中 行${rowNumber}: ${characterData.character_id} - ${characterData.character_name_jp || characterData.character_name_en}`);
                
                // データベースに保存（ドライランでない場合）
                if (!dryRun) {
                  const result = await client.models.Character.create(characterData);
                  
                  if (result.data) {
                    successCount++;
                    console.log(`✓ 行${rowNumber}: ${characterData.character_name_jp || characterData.character_name_en} 作成完了`);
                  } else {
                    throw new Error('データ作成に失敗しました');
                  }
                } else {
                  successCount++;
                  console.log(`✓ 行${rowNumber}: ${characterData.character_name_jp || characterData.character_name_en} [ドライラン]`);
                }
                
              } catch (error) {
                errorCount++;
                const errorMessage = `❌ 行${rowNumber}: ${error.message}`;
                console.error(errorMessage);
                errors.push({
                  row: rowNumber,
                  data: row,
                  error: error.message
                });
              }
            }
            
            // 5. 結果サマリー
            console.log('\n=== インポート結果 ===');
            console.log(`成功: ${successCount}件`);
            console.log(`スキップ: ${skippedCount}件`);
            console.log(`エラー: ${errorCount}件`);
            console.log(`処理総数: ${csvData.length}件`);
            console.log(`成功率: ${((successCount / csvData.length) * 100).toFixed(1)}%`);
            
            if (errors.length > 0) {
              console.log('\n=== エラー詳細 ===');
              errors.forEach(error => {
                console.log(`行${error.row}: ${error.error}`);
                console.log(`  データ: ${JSON.stringify(error.data)}`);
              });
            }
            
            // 6. 最終確認
            if (!dryRun) {
              const { data: finalCharacters } = await client.models.Character.list({ authMode: 'apiKey' });
              const validFinalCharacters = (finalCharacters || []).filter(c => c !== null);
              console.log(`\n現在の総キャラクター数: ${validFinalCharacters.length}`);
              
              // キャラクター一覧表示（最初の10件）
              console.log('\n=== 登録済みキャラクター（最新10件） ===');
              validFinalCharacters
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
                .forEach(char => {
                  console.log(`  ${char.character_id}: ${char.character_name_jp || char.character_name_en} (${char.character_name_en})`);
                });
            }
            
            resolve();
            
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    
  } catch (error) {
    console.error('❌ インポートエラー:', error);
    throw error;
  }
}

// CSVテンプレート生成関数
async function generateCharacterCSVTemplate() {
  console.log('キャラクターCSVテンプレート生成開始...');
  
  try {
    console.log('=== キャラクターCSVテンプレート ===');
    
    // ヘッダー行
    console.log('\n=== CSVヘッダー ===');
    console.log(EXPECTED_HEADERS.join(','));
    
    // サンプルデータ
    console.log('\n=== サンプルデータ ===');
    const sampleData = [
      '011',                           // character_id
      'Ryu Hayabusa',                  // character_name_en
      'リュウ・ハヤブサ',              // character_name_jp
      '竜の忍者',                      // nickname
      '175',                           // height
      '70',                            // weight
      '日本',                          // nationality
      '忍術',                          // martial_arts
      '古代より続く忍者の血筋を引く戦士。竜剣を操り、悪を討つ。' // character_description
    ];
    console.log(sampleData.join(','));
    
    // フィールド説明
    console.log('\n=== フィールド説明 ===');
    console.log('character_id         : キャラクターID（必須、3桁推奨、例: 011）');
    console.log('character_name_en    : 英語名（必須、例: Ryu Hayabusa）');
    console.log('character_name_jp    : 日本語名（オプション、例: リュウ・ハヤブサ）');
    console.log('nickname             : ニックネーム・称号（オプション、例: 竜の忍者）');
    console.log('height               : 身長（オプション、数値のみ、例: 175）');
    console.log('weight               : 体重（オプション、数値のみ、例: 70）');
    console.log('nationality          : 国籍（オプション、例: 日本）');
    console.log('martial_arts         : 格闘技・流派（オプション、例: 忍術）');
    console.log('character_description: キャラクター説明（オプション）');
    
    console.log('\n=== 注意事項 ===');
    console.log('- CSVファイルは UTF-8 エンコーディングで保存してください');
    console.log('- 必須フィールド: character_id, character_name_en');
    console.log('- character_id は他のキャラクターと重複しないようにしてください');
    console.log('- height, weight は文字列として保存されます（例: "175cm", "70kg", "不明"）');
    console.log('- 説明文にカンマが含まれる場合は、ダブルクォートで囲ってください');
    
  } catch (error) {
    console.error('❌ テンプレート生成エラー:', error);
  }
}

// バリデーション関数
async function validateCharacterCSV(csvFilePath) {
  console.log('キャラクターCSVバリデーション開始:', csvFilePath);
  
  try {
    const csvData = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });
    
    const stream = createReadStream(csvFilePath, { encoding: 'utf8' });
    
    return new Promise((resolve, reject) => {
      stream.pipe(parser)
        .on('data', (row) => {
          csvData.push(row);
        })
        .on('end', async () => {
          try {
            console.log(`CSVデータ読み込み完了: ${csvData.length}行`);
            
            if (csvData.length === 0) {
              console.log('❌ CSVファイルが空です');
              resolve();
              return;
            }
            
            // ヘッダー検証
            const headers = Object.keys(csvData[0]);
            console.log('\n=== ヘッダー検証 ===');
            console.log('検出されたヘッダー:', headers);
            
            const requiredFields = ['character_id', 'character_name_en'];
            const missingRequired = requiredFields.filter(field => !headers.includes(field));
            
            if (missingRequired.length > 0) {
              console.log('❌ 必須フィールドが不足:', missingRequired);
            } else {
              console.log('✓ 必須フィールドすべて存在');
            }
            
            // データ検証
            console.log('\n=== データ検証 ===');
            let validRows = 0;
            let errorRows = 0;
            const errors = [];
            const characterIds = new Set();
            const duplicateIds = new Set();
            
            for (let i = 0; i < csvData.length; i++) {
              const row = csvData[i];
              const rowNumber = i + 2;
              const rowErrors = [];
              
              // 必須フィールド検証
              if (!row.character_id || row.character_id.trim() === '') {
                rowErrors.push('character_id が空');
              } else {
                // 重複チェック
                if (characterIds.has(row.character_id)) {
                  duplicateIds.add(row.character_id);
                  rowErrors.push(`character_id が重複: ${row.character_id}`);
                } else {
                  characterIds.add(row.character_id);
                }
              }
              
              if (!row.character_name_en || row.character_name_en.trim() === '') {
                rowErrors.push('character_name_en が空');
              }
              
              // 数値フィールド検証
              ['height', 'weight'].forEach(field => {
                if (row[field] && row[field] !== '') {
                  const value = parseInt(row[field], 10);
                  if (isNaN(value) || value <= 0) {
                    rowErrors.push(`${field} は正の整数である必要があります: ${row[field]}`);
                  }
                }
              });
              
              if (rowErrors.length > 0) {
                errorRows++;
                errors.push({
                  row: rowNumber,
                  character: row.character_id || '不明',
                  errors: rowErrors
                });
              } else {
                validRows++;
              }
            }
            
            // 結果表示
            console.log('\n=== バリデーション結果 ===');
            console.log(`総行数: ${csvData.length}`);
            console.log(`有効行数: ${validRows}`);
            console.log(`エラー行数: ${errorRows}`);
            console.log(`成功率: ${((validRows / csvData.length) * 100).toFixed(1)}%`);
            
            if (duplicateIds.size > 0) {
              console.log(`❌ 重複キャラクターID: ${Array.from(duplicateIds).join(', ')}`);
            }
            
            if (errors.length > 0) {
              console.log('\n=== エラー詳細（最初の10件） ===');
              errors.slice(0, 10).forEach(error => {
                console.log(`行${error.row} (${error.character}):`);
                error.errors.forEach(err => console.log(`  - ${err}`));
              });
              
              if (errors.length > 10) {
                console.log(`... 他${errors.length - 10}件のエラー`);
              }
            }
            
            resolve();
            
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    
  } catch (error) {
    console.error('❌ バリデーションエラー:', error);
  }
}

// コマンドライン引数処理
const args = process.argv.slice(2);
const command = args[0];
const csvFile = args[1];
const options = {
  replaceAll: args.includes('--replace-all'),
  dryRun: args.includes('--dry-run')
};

switch (command) {
  case 'template':
    await generateCharacterCSVTemplate();
    break;
    
  case 'validate':
    if (!csvFile) {
      console.log('使用方法: node scripts/import-character-csv.js validate <CSVファイルパス>');
      process.exit(1);
    }
    await validateCharacterCSV(csvFile);
    break;
    
  case 'import':
    if (!csvFile) {
      console.log('使用方法: node scripts/import-character-csv.js import <CSVファイルパス> [--replace-all] [--dry-run]');
      process.exit(1);
    }
    await importCharacterCSV(csvFile, options);
    break;
    
  default:
    console.log('キャラクターCSVインポートスクリプト');
    console.log('');
    console.log('使用方法:');
    console.log('  template           - CSVテンプレートを表示');
    console.log('  validate <csv>     - CSVファイルをバリデーション');
    console.log('  import <csv>       - CSVファイルをインポート');
    console.log('');
    console.log('オプション:');
    console.log('  --replace-all      - 既存データを全て削除してから追加');
    console.log('  --dry-run          - 実際の処理は行わずバリデーションのみ');
    console.log('');
    console.log('例:');
    console.log('  node scripts/import-character-csv.js template');
    console.log('  node scripts/import-character-csv.js validate ./data/characters.csv');
    console.log('  node scripts/import-character-csv.js import ./data/characters.csv');
    console.log('  node scripts/import-character-csv.js import ./data/characters.csv --replace-all');
    console.log('  node scripts/import-character-csv.js import ./data/characters.csv --dry-run');
}