// scripts/validate-character-csv.js
import { readFile } from 'fs/promises';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

// 必須フィールド
const REQUIRED_FIELDS = [
  'character_id',
  'character_name_en'
];

// 期待されるヘッダー（実際のCSVファイル順序）
const EXPECTED_HEADERS = [
  'character_id',
  'character_name_en',
  'character_name_jp',
  'nickname',
  'nationality',
  'height',
  'weight',
  'martial_arts',
  'character_description'
];

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
            
            // 必須フィールドチェック
            const missingRequired = REQUIRED_FIELDS.filter(field => !headers.includes(field));
            if (missingRequired.length > 0) {
              console.log('❌ 必須フィールドが不足:', missingRequired);
            } else {
              console.log('✓ 必須フィールドすべて存在');
            }
            
            // ヘッダー順序確認
            const headerOrderOK = JSON.stringify(headers) === JSON.stringify(EXPECTED_HEADERS);
            if (headerOrderOK) {
              console.log('✓ ヘッダー順序は正しい');
            } else {
              console.log('⚠ ヘッダー順序が期待と異なります');
              console.log('期待:', EXPECTED_HEADERS);
              console.log('実際:', headers);
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
              if (!row.character_id || row.character_id.toString().trim() === '') {
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
              
              if (!row.character_name_en || row.character_name_en.toString().trim() === '') {
                rowErrors.push('character_name_en が空');
              }
              
              // height/weightは文字列として任意の値を許可（検証なし）
              // "不明"、"180cm"、"83.5kg" などすべて有効
              
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
            
            // 統計情報
            console.log('\n=== バリデーション結果 ===');
            console.log(`総行数: ${csvData.length}`);
            console.log(`有効行数: ${validRows}`);
            console.log(`エラー行数: ${errorRows}`);
            console.log(`成功率: ${((validRows / csvData.length) * 100).toFixed(1)}%`);
            
            if (duplicateIds.size > 0) {
              console.log(`❌ 重複キャラクターID: ${Array.from(duplicateIds).join(', ')}`);
            } else {
              console.log('✓ 重複なし');
            }
            
            if (errors.length > 0) {
              console.log('\n=== エラー詳細 ===');
              errors.slice(0, 10).forEach(error => {
                console.log(`行${error.row} (${error.character}):`);
                error.errors.forEach(err => console.log(`  - ${err}`));
              });
              
              if (errors.length > 10) {
                console.log(`... 他${errors.length - 10}件のエラー`);
              }
            }
            
            // データ統計
            console.log('\n=== データ統計 ===');
            const stats = {
              withJpName: csvData.filter(r => r.character_name_jp && r.character_name_jp.toString().trim() !== '').length,
              withNickname: csvData.filter(r => r.nickname && r.nickname.toString().trim() !== '').length,
              withHeight: csvData.filter(r => r.height && r.height.toString().trim() !== '').length,
              withWeight: csvData.filter(r => r.weight && r.weight.toString().trim() !== '').length,
              withNationality: csvData.filter(r => r.nationality && r.nationality.toString().trim() !== '').length,
              withMartialArts: csvData.filter(r => r.martial_arts && r.martial_arts.toString().trim() !== '').length,
              withDescription: csvData.filter(r => r.character_description && r.character_description.toString().trim() !== '').length
            };
            
            console.log('フィールド設定率:');
            Object.entries(stats).forEach(([field, count]) => {
              const percentage = ((count / csvData.length) * 100).toFixed(1);
              console.log(`  ${field}: ${count}/${csvData.length} (${percentage}%)`);
            });
            
            // インポート可能性評価
            console.log('\n=== インポート評価 ===');
            if (errorRows === 0) {
              console.log('🎉 すべてのデータが有効です！インポート可能です');
            } else if (errorRows < csvData.length * 0.1) {
              console.log('⚠ 軽微なエラーがありますが、大部分はインポート可能です');
            } else {
              console.log('❌ 多くのエラーがあります。修正を推奨します');
            }
            
            console.log('\n次のステップ:');
            if (errorRows === 0) {
              console.log('✅ npm run character-csv import character.csv --replace-all');
            } else {
              console.log('1. 上記エラーを修正');
              console.log('2. 再度バリデーション実行');
              console.log('3. インポート実行');
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
const csvFile = args[0];

if (!csvFile) {
  console.log('使用方法: node scripts/validate-character-csv.js <CSVファイルパス>');
  console.log('例: node scripts/validate-character-csv.js character.csv');
  process.exit(1);
}

validateCharacterCSV(csvFile);