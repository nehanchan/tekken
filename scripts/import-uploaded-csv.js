// scripts/import-move-csv.js (本番用・完全版)
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

// 期待されるCSVヘッダー
const EXPECTED_HEADERS = [
  'move_id',
  'move_num', 
  'character_id',
  'move_category_id',
  'move_name',
  'move_name_kana',
  'command',
  'startup_frame',
  'active_frame',
  'hit_frame',
  'block_frame',
  'attribute',
  'effect_id_1',
  'effect_id_2',
  'effect_id_3',
  'effect_id_4',
  'effect_id_5',
  'remarks_1',
  'remarks_2',
  'remarks_3',
  'remarks_4',
  'remarks_5'
];

// 必須フィールド
const REQUIRED_FIELDS = [
  'move_id',
  'character_id',
  'move_category_id',
  'move_name'
];

/**
 * 全ての技分類を取得（ページネーション対応）
 */
async function fetchAllCategories() {
  let allCategories = [];
  let nextToken = null;
  let pageCount = 0;
  
  do {
    pageCount++;
    console.log(`技分類取得 ページ ${pageCount}...`);
    
    const params = {
      authMode: 'apiKey',
      limit: 1000
    };
    
    if (nextToken) {
      params.nextToken = nextToken;
    }
    
    const result = await client.models.MoveCategory.list(params);
    const pageCategories = (result.data || []).filter(c => c !== null);
    allCategories = allCategories.concat(pageCategories);
    nextToken = result.nextToken;
    
  } while (nextToken);
  
  return allCategories;
}

/**
 * 全てのキャラクターを取得（ページネーション対応）
 */
async function fetchAllCharacters() {
  let allCharacters = [];
  let nextToken = null;
  let pageCount = 0;
  
  do {
    pageCount++;
    console.log(`キャラクター取得 ページ ${pageCount}...`);
    
    const params = {
      authMode: 'apiKey',
      limit: 1000
    };
    
    if (nextToken) {
      params.nextToken = nextToken;
    }
    
    const result = await client.models.Character.list(params);
    const pageCharacters = (result.data || []).filter(c => c !== null);
    allCharacters = allCharacters.concat(pageCharacters);
    nextToken = result.nextToken;
    
  } while (nextToken);
  
  return allCharacters;
}

/**
 * 全ての既存技を取得（ページネーション対応）
 */
async function fetchAllMoves() {
  let allMoves = [];
  let nextToken = null;
  let pageCount = 0;
  
  do {
    pageCount++;
    console.log(`既存技取得 ページ ${pageCount}...`);
    
    const params = {
      authMode: 'apiKey',
      limit: 1000
    };
    
    if (nextToken) {
      params.nextToken = nextToken;
    }
    
    const result = await client.models.Move.list(params);
    const pageMoves = (result.data || []).filter(m => m !== null);
    allMoves = allMoves.concat(pageMoves);
    nextToken = result.nextToken;
    
  } while (nextToken);
  
  return allMoves;
}

/**
 * CSVファイル読み込み
 */
async function readCSVFile(csvFilePath) {
  return new Promise((resolve, reject) => {
    const csvData = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });
    
    const stream = createReadStream(csvFilePath, { encoding: 'utf8' });
    
    stream.pipe(parser)
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', () => {
        resolve(csvData);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * CSVデータの事前バリデーション
 */
async function validateCSVData(csvData, characterMap, categoryMap) {
  const errors = [];
  const duplicateIds = new Set();
  const moveIds = new Set();
  
  csvData.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowErrors = [];
    
    // 必須フィールド検証
    REQUIRED_FIELDS.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        rowErrors.push(`${field} が空`);
      }
    });
    
    // move_id重複チェック
    if (row.move_id) {
      const moveId = String(row.move_id).trim();
      if (moveIds.has(moveId)) {
        duplicateIds.add(moveId);
        rowErrors.push(`move_id が重複: ${moveId}`);
      } else {
        moveIds.add(moveId);
      }
    }
    
    // 参照整合性チェック
    if (row.character_id) {
      const charId = String(row.character_id).trim();
      if (!characterMap.has(charId)) {
        rowErrors.push(`character_id "${charId}" が存在しません`);
      }
    }
    
    if (row.move_category_id) {
      const catId = String(row.move_category_id).trim();
      if (!categoryMap.has(catId)) {
        rowErrors.push(`move_category_id "${catId}" が存在しません`);
      }
    }
    
    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        moveId: row.move_id || '不明',
        errors: rowErrors
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    duplicateIds
  };
}

/**
 * CSVデータをMove型に変換
 */
function convertCSVRowToMove(row, categoryMap) {
  // エフェクトIDを配列に変換
  const effects = [];
  for (let i = 1; i <= 5; i++) {
    const effectId = row[`effect_id_${i}`];
    if (effectId && String(effectId).trim() !== '') {
      effects.push(String(effectId).trim());
    }
  }
  
  // 備考を配列に変換
  const remarks = [];
  for (let i = 1; i <= 5; i++) {
    const remark = row[`remarks_${i}`];
    if (remark && String(remark).trim() !== '') {
      remarks.push(String(remark).trim());
    }
  }
  
  // 技分類IDからDBのIDを取得
  const categoryId = String(row.move_category_id).trim();
  const category = categoryMap.get(categoryId);
  
  return {
    move_id: String(row.move_id).trim(),
    move_num: row.move_num ? parseInt(row.move_num, 10) : null,
    character_id: String(row.character_id).trim(),
    move_category_id: category ? category.id : null, // DBの内部IDを使用
    move_name: String(row.move_name).trim(),
    move_name_kana: row.move_name_kana ? String(row.move_name_kana).trim() : null,
    command: row.command ? String(row.command).trim() : null,
    startup_frame: row.startup_frame ? parseInt(row.startup_frame, 10) : null,
    active_frame: row.active_frame ? String(row.active_frame).trim() : null,
    hit_frame: row.hit_frame ? String(row.hit_frame).trim() : null,
    block_frame: row.block_frame ? String(row.block_frame).trim() : null,
    attribute: row.attribute ? String(row.attribute).trim() : null,
    effects: effects.length > 0 ? effects : null,
    remarks: remarks.length > 0 ? remarks : null
  };
}

/**
 * バックアップファイル作成
 */
async function createBackup(existingMoves) {
  if (existingMoves.length === 0) return null;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFileName = `move_backup_${timestamp}.json`;
  
  const { writeFile } = await import('fs/promises');
  await writeFile(backupFileName, JSON.stringify(existingMoves, null, 2), 'utf8');
  
  console.log(`💾 バックアップファイル作成: ${backupFileName}`);
  return backupFileName;
}

/**
 * ロールバック実行
 */
async function rollbackMoves(createdMoves, backupMoves, replaceAll) {
  console.log('\n🔄 ロールバック開始...');
  
  let rollbackErrors = [];
  
  try {
    // 作成された技を削除
    if (createdMoves.length > 0) {
      console.log(`作成された技を削除中: ${createdMoves.length}件`);
      for (const move of createdMoves) {
        try {
          await client.models.Move.delete({ id: move.id });
          console.log(`  削除: ${move.move_id} - ${move.move_name}`);
        } catch (error) {
          rollbackErrors.push(`削除失敗: ${move.move_id} - ${error.message}`);
        }
      }
    }
    
    // バックアップから復元（replaceAllの場合）
    if (replaceAll && backupMoves && backupMoves.length > 0) {
      console.log(`バックアップから復元中: ${backupMoves.length}件`);
      for (const backup of backupMoves) {
        try {
          // システムフィールドを除外して復元
          const { id, createdAt, updatedAt, ...restoreData } = backup;
          await client.models.Move.create(restoreData);
          console.log(`  復元: ${backup.move_id} - ${backup.move_name}`);
        } catch (error) {
          rollbackErrors.push(`復元失敗: ${backup.move_id} - ${error.message}`);
        }
      }
    }
    
    if (rollbackErrors.length === 0) {
      console.log('✅ ロールバック完了');
    } else {
      console.log(`⚠️ ロールバック中にエラー: ${rollbackErrors.length}件`);
      rollbackErrors.slice(0, 5).forEach(error => console.log(`  ${error}`));
    }
    
  } catch (error) {
    console.error('❌ ロールバック中に致命的エラー:', error.message);
  }
  
  return rollbackErrors;
}

/**
 * 技マスタCSVインポート（本番用）
 */
async function importMoveCSV(csvFilePath, options = {}) {
  const { 
    replaceAll = false, 
    dryRun = false, 
    batchSize = 50,
    continueOnError = false 
  } = options;
  
  console.log('🚀 技マスタCSVインポート開始 (本番用)');
  console.log(`ファイル: ${csvFilePath}`);
  console.log(`モード: ${replaceAll ? '全置換' : '追加'}, ${dryRun ? 'ドライラン' : '実行'}`);
  console.log(`バッチサイズ: ${batchSize}, エラー時継続: ${continueOnError}`);
  
  let backupData = null;
  let createdMoves = [];
  let importStarted = false;
  
  try {
    // 1. 参照データ取得
    console.log('\n📋 参照データ取得中...');
    const [characters, categories, existingMoves] = await Promise.all([
      fetchAllCharacters(),
      fetchAllCategories(),
      fetchAllMoves()
    ]);
    
    console.log(`キャラクター: ${characters.length}件`);
    console.log(`技分類: ${categories.length}件`);
    console.log(`既存技: ${existingMoves.length}件`);
    
    // 参照マップ作成
    const characterMap = new Map();
    const categoryMap = new Map();
    
    characters.forEach(char => {
      if (char.character_id) {
        characterMap.set(String(char.character_id).trim(), char);
      }
    });
    
    categories.forEach(cat => {
      if (cat.move_category_id) {
        categoryMap.set(String(cat.move_category_id).trim(), cat);
      }
    });
    
    // 2. CSVファイル読み込み
    console.log('\n📖 CSVファイル読み込み中...');
    const csvData = await readCSVFile(csvFilePath);
    console.log(`CSVデータ: ${csvData.length}行`);
    
    // 3. 事前バリデーション
    console.log('\n🔍 事前バリデーション実行中...');
    const validation = await validateCSVData(csvData, characterMap, categoryMap);
    
    if (!validation.isValid) {
      console.log(`❌ バリデーションエラー: ${validation.errors.length}件`);
      console.log('\n最初の5件のエラー:');
      validation.errors.slice(0, 5).forEach(error => {
        console.log(`行${error.row}: ${error.errors.join(', ')}`);
      });
      
      if (!continueOnError) {
        throw new Error(`バリデーション失敗。--continue-on-error オプションで強制実行可能`);
      } else {
        console.log('⚠️ エラーがありますが、継続実行します...');
      }
    } else {
      console.log('✅ 事前バリデーション完了');
    }
    
    // 4. バックアップ作成（replaceAllの場合）
    if (replaceAll && existingMoves.length > 0) {
      console.log('\n💾 既存データバックアップ中...');
      backupData = existingMoves;
      await createBackup(existingMoves);
    }
    
    // 5. 既存データ削除（replaceAllの場合）
    if (replaceAll && !dryRun) {
      console.log('\n🗑️ 既存技データ削除中...');
      let deleteCount = 0;
      
      for (const move of existingMoves) {
        try {
          await client.models.Move.delete({ id: move.id });
          deleteCount++;
          
          if (deleteCount % 100 === 0) {
            console.log(`  削除進捗: ${deleteCount}/${existingMoves.length}`);
          }
        } catch (error) {
          console.error(`削除失敗: ${move.move_id} - ${error.message}`);
        }
      }
      
      console.log(`削除完了: ${deleteCount}件`);
    }
    
    importStarted = true;
    
    // 6. データインポート実行
    console.log('\n💾 データインポート開始...');
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // 既存move_idマップ作成（追加モード用）
    const existingMoveIdMap = new Map();
    if (!replaceAll) {
      existingMoves.forEach(move => {
        if (move.move_id) {
          existingMoveIdMap.set(move.move_id, move);
        }
      });
    }
    
    // バッチ処理
    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(csvData.length / batchSize);
      
      console.log(`バッチ ${batchNumber}/${totalBatches} 処理中... (${batch.length}件)`);
      
      for (const row of batch) {
        const rowNumber = csvData.indexOf(row) + 2;
        
        try {
          // 重複チェック（追加モード時）
          if (!replaceAll && existingMoveIdMap.has(row.move_id)) {
            skippedCount++;
            console.log(`⚠️ 行${rowNumber}: move_id "${row.move_id}" は既に存在するためスキップ`);
            continue;
          }
          
          // 個別行バリデーション
          if (!row.move_id || !row.character_id || !row.move_category_id || !row.move_name) {
            throw new Error('必須フィールドが不足');
          }
          
          if (!characterMap.has(String(row.character_id).trim())) {
            throw new Error(`character_id "${row.character_id}" が存在しません`);
          }
          
          if (!categoryMap.has(String(row.move_category_id).trim())) {
            throw new Error(`move_category_id "${row.move_category_id}" が存在しません`);
          }
          
          // Move データ作成
          const moveData = convertCSVRowToMove(row, categoryMap);
          
          // データベースに保存
          if (!dryRun) {
            const result = await client.models.Move.create(moveData);
            
            if (result.data) {
              createdMoves.push(result.data);
              successCount++;
              
              if (successCount % 100 === 0) {
                console.log(`✅ 進捗: ${successCount}件完了`);
              }
            } else {
              throw new Error('データ作成に失敗');
            }
          } else {
            successCount++;
          }
          
        } catch (error) {
          errorCount++;
          const errorMessage = `❌ 行${rowNumber} (${row.move_id}): ${error.message}`;
          errors.push(errorMessage);
          
          if (errorCount <= 10) {
            console.error(errorMessage);
          }
          
          // エラー時のロールバック判定
          if (!continueOnError && !dryRun) {
            console.log('\n🔴 エラーが発生しました。ロールバックを実行します...');
            await rollbackMoves(createdMoves, backupData, replaceAll);
            throw new Error(`行${rowNumber}でエラーが発生したため、インポートを中止しました`);
          }
        }
      }
    }
    
    // 7. 結果サマリー
    console.log('\n📊 インポート結果');
    console.log(`成功: ${successCount}件`);
    console.log(`スキップ: ${skippedCount}件`);
    console.log(`エラー: ${errorCount}件`);
    console.log(`処理総数: ${csvData.length}件`);
    console.log(`成功率: ${((successCount / csvData.length) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log(`\n❌ エラー詳細 (最初の10件):`);
      errors.slice(0, 10).forEach(error => console.log(`  ${error}`));
      
      if (errors.length > 10) {
        console.log(`  ... 他${errors.length - 10}件のエラー`);
      }
    }
    
    // 8. 最終確認
    if (!dryRun) {
      const finalMoves = await fetchAllMoves();
      console.log(`\n現在の総技数: ${finalMoves.length}件`);
    }
    
    // 9. 成功判定
    if (successCount === csvData.length) {
      console.log('\n🎉 すべてのデータが正常にインポートされました！');
    } else if (errorCount === 0) {
      console.log('\n✅ エラーなしでインポート完了（一部スキップあり）');
    } else if (errorCount < csvData.length * 0.1) {
      console.log('\n⚠️ 軽微なエラーがありましたが、インポートは完了しました');
    } else {
      console.log('\n🔶 多数のエラーがありました。データの整合性を確認してください');
    }
    
    return {
      success: successCount,
      skipped: skippedCount,
      errors: errorCount,
      total: csvData.length
    };
    
  } catch (error) {
    console.error('\n💥 致命的エラー:', error.message);
    
    // エラー時の自動ロールバック
    if (importStarted && createdMoves.length > 0 && !dryRun) {
      console.log('\n🔄 自動ロールバックを実行します...');
      await rollbackMoves(createdMoves, backupData, replaceAll);
    }
    
    throw error;
  }
}

// コマンドライン引数処理
const args = process.argv.slice(2);
const command = args[0];
const csvFile = args[1];

const options = {
  replaceAll: args.includes('--replace-all'),
  dryRun: args.includes('--dry-run'),
  continueOnError: args.includes('--continue-on-error'),
  batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 50
};

switch (command) {
  case 'import':
    if (!csvFile) {
      console.log('使用方法: node scripts/import-move-csv.js import <CSVファイルパス> [オプション]');
      console.log('');
      console.log('オプション:');
      console.log('  --replace-all       既存データを全て削除してから追加');
      console.log('  --dry-run           実際の処理は行わずテストのみ');
      console.log('  --continue-on-error エラーが発生しても処理を継続');
      console.log('  --batch-size=N      バッチサイズを指定（デフォルト: 50）');
      console.log('');
      console.log('例:');
      console.log('  node scripts/import-move-csv.js import moves.csv');
      console.log('  node scripts/import-move-csv.js import moves.csv --replace-all');
      console.log('  node scripts/import-move-csv.js import moves.csv --dry-run');
      console.log('  node scripts/import-move-csv.js import moves.csv --continue-on-error --batch-size=100');
      process.exit(1);
    }
    
    try {
      await importMoveCSV(csvFile, options);
      console.log('\n✅ インポート処理完了');
    } catch (error) {
      console.error('\n❌ インポート処理失敗');
      process.exit(1);
    }
    break;
    
  default:
    console.log('技マスタCSVインポートスクリプト (本番用)');
    console.log('');
    console.log('使用方法:');
    console.log('  import <csv>        CSVファイルをインポート');
    console.log('');
    console.log('推奨手順:');
    console.log('1. node scripts/validate-move-csv.js moves.csv');
    console.log('2. node scripts/import-move-csv.js import moves.csv --dry-run');
    console.log('3. node scripts/import-move-csv.js import moves.csv --replace-all');
}