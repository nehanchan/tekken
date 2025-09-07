// scripts/import-move-category-csv.js
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
const MOVE_CATEGORY_FIELD_MAPPING = {
  'move_category_id': 'move_category_id',
  'move_category': 'move_category'
};

// 期待されるCSVヘッダー
const EXPECTED_HEADERS = [
  'move_category_id',
  'move_category'
];

async function importMoveCategoryCSV(csvFilePath, options = {}) {
  const { replaceAll = false, dryRun = false } = options;
  
  console.log('技分類マスタCSVインポート開始:', csvFilePath);
  console.log(`モード: ${replaceAll ? '全置換' : '追加'}, ${dryRun ? 'ドライラン' : '実行'}`);
  
  let backupData = [];
  let createdRecords = [];
  
  try {
    // 1. 既存データの確認とバックアップ
    const { data: existingCategories } = await client.models.MoveCategory.list({ authMode: 'apiKey' });
    const validExistingCategories = (existingCategories || []).filter(c => c !== null);
    
    console.log(`既存技分類数: ${validExistingCategories.length}`);
    
    if (replaceAll && validExistingCategories.length > 0) {
      backupData = validExistingCategories;
      console.log('全置換モード: 既存データをバックアップしました');
      
      if (!dryRun) {
        for (const category of validExistingCategories) {
          await client.models.MoveCategory.delete({ id: category.id });
          console.log(`  削除: ${category.move_category_id} - ${category.move_category}`);
        }
      }
    }
    
    // 2. CSVファイルを読み込み
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
              console.log('CSVデータが空です');
              resolve();
              return;
            }
            
            // 3. ヘッダー検証
            const headers = Object.keys(csvData[0]);
            console.log('\n=== ヘッダー検証 ===');
            console.log('検出されたヘッダー:', headers);
            
            const missingRequired = EXPECTED_HEADERS.filter(field => !headers.includes(field));
            if (missingRequired.length > 0) {
              throw new Error(`必須フィールドが不足しています: ${missingRequired.join(', ')}`);
            }
            
            console.log('✓ ヘッダー検証完了');
            
            // 4. データ処理
            console.log('\n=== データ処理 ===');
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            const errors = [];
            
            // 既存データマップ作成（追加モード用）
            const existingMap = new Map();
            if (!replaceAll) {
              validExistingCategories.forEach(cat => {
                existingMap.set(cat.move_category_id, cat);
              });
            }
            
            for (let i = 0; i < csvData.length; i++) {
              const row = csvData[i];
              const rowNumber = i + 2;
              
              try {
                // 必須フィールドチェック
                if (!row.move_category_id || !row.move_category) {
                  throw new Error(`必須フィールドが不足: move_category_id=${row.move_category_id}, move_category=${row.move_category}`);
                }
                
                // 重複チェック（追加モード時）
                if (!replaceAll && existingMap.has(row.move_category_id)) {
                  skippedCount++;
                  console.log(`⚠ 行${rowNumber}: カテゴリID "${row.move_category_id}" は既に存在するためスキップ`);
                  continue;
                }
                
                // 技分類データ作成
                const categoryData = {
                  move_category_id: row.move_category_id.trim(),
                  move_category: row.move_category.trim()
                };
                
                console.log(`処理中 行${rowNumber}: ${categoryData.move_category_id} - ${categoryData.move_category}`);
                
                // データベースに保存
                if (!dryRun) {
                  const result = await client.models.MoveCategory.create(categoryData);
                  
                  if (result.data) {
                    createdRecords.push(result.data);
                    successCount++;
                    console.log(`✓ 行${rowNumber}: ${categoryData.move_category} 作成完了`);
                  } else {
                    throw new Error('データ作成に失敗しました');
                  }
                } else {
                  successCount++;
                  console.log(`✓ 行${rowNumber}: ${categoryData.move_category} [ドライラン]`);
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
                
                // エラー時のロールバック
                if (!dryRun && createdRecords.length > 0) {
                  console.log('\n🔄 エラーが発生しました。ロールバックを実行します...');
                  await rollbackMoveCategories(createdRecords, backupData, replaceAll);
                  throw new Error(`行${rowNumber}でエラーが発生したため、インポートを中止し、ロールバックしました`);
                }
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
              const { data: finalCategories } = await client.models.MoveCategory.list({ authMode: 'apiKey' });
              const validFinalCategories = (finalCategories || []).filter(c => c !== null);
              console.log(`\n現在の総技分類数: ${validFinalCategories.length}`);
              
              console.log('\n=== 登録済み技分類一覧 ===');
              validFinalCategories
                .sort((a, b) => a.move_category_id.localeCompare(b.move_category_id))
                .forEach(cat => {
                  console.log(`  ${cat.move_category_id}: ${cat.move_category}`);
                });
            }
            
            if (successCount === csvData.length) {
              console.log('\n🎉 すべてのデータが正常にインポートされました！');
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

// ロールバック関数
async function rollbackMoveCategories(createdRecords, backupData, wasReplaceAll) {
  console.log('\n🔄 技分類マスタロールバック開始...');
  
  try {
    // 作成されたレコードを削除
    if (createdRecords.length > 0) {
      console.log(`作成されたレコードを削除中: ${createdRecords.length}件`);
      for (const record of createdRecords) {
        await client.models.MoveCategory.delete({ id: record.id });
        console.log(`  削除: ${record.move_category_id} - ${record.move_category}`);
      }
    }
    
    // バックアップデータを復元（replaceAllの場合）
    if (wasReplaceAll && backupData.length > 0) {
      console.log(`バックアップデータを復元中: ${backupData.length}件`);
      for (const backup of backupData) {
        const restoreData = {
          move_category_id: backup.move_category_id,
          move_category: backup.move_category
        };
        
        await client.models.MoveCategory.create(restoreData);
        console.log(`  復元: ${backup.move_category_id} - ${backup.move_category}`);
      }
    }
    
    console.log('✅ ロールバック完了');
    
  } catch (rollbackError) {
    console.error('❌ ロールバック中にエラーが発生:', rollbackError.message);
  }
}

// CSVテンプレート生成関数
async function generateMoveCategoryCSVTemplate() {
  console.log('技分類マスタCSVテンプレート生成開始...');
  
  try {
    console.log('=== 技分類マスタCSVテンプレート ===');
    
    // ヘッダー行
    console.log('\n=== CSVヘッダー ===');
    console.log(EXPECTED_HEADERS.join(','));
    
    // サンプルデータ
    console.log('\n=== サンプルデータ ===');
    const sampleData = [
      ['001', '打撃技'],
      ['002', '投げ技'],
      ['003', '特殊技'],
      ['004', '必殺技'],
      ['005', 'コンボ技'],
      ['006', 'カウンター技']
    ];
    
    sampleData.forEach(row => {
      console.log(row.join(','));
    });
    
    // フィールド説明
    console.log('\n=== フィールド説明 ===');
    console.log('move_category_id : カテゴリID（必須、例: 001, 002）');
    console.log('move_category    : 技分類名（必須、例: 打撃技, 投げ技）');
    
    console.log('\n=== 注意事項 ===');
    console.log('- CSVファイルは UTF-8 エンコーディングで保存してください');
    console.log('- 必須フィールド: move_category_id, move_category');
    console.log('- move_category_id は他の技分類と重複しないようにしてください');
    
  } catch (error) {
    console.error('❌ テンプレート生成エラー:', error);
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
    await generateMoveCategoryCSVTemplate();
    break;
    
  case 'import':
    if (!csvFile) {
      console.log('使用方法: node scripts/import-move-category-csv.js import <CSVファイルパス> [--replace-all] [--dry-run]');
      process.exit(1);
    }
    await importMoveCategoryCSV(csvFile, options);
    break;
    
  default:
    console.log('技分類マスタCSVインポートスクリプト');
    console.log('');
    console.log('使用方法:');
    console.log('  template           - CSVテンプレートを表示');
    console.log('  import <csv>       - CSVファイルをインポート');
    console.log('');
    console.log('オプション:');
    console.log('  --replace-all      - 既存データを全て削除してから追加');
    console.log('  --dry-run          - 実際の処理は行わずテストのみ');
    console.log('');
    console.log('例:');
    console.log('  node scripts/import-move-category-csv.js template');
    console.log('  node scripts/import-move-category-csv.js import move_categories.csv');
    console.log('  node scripts/import-move-category-csv.js import move_categories.csv --replace-all');
}