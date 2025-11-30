// scripts/safe-import-character-csv.js
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

// 期待されるCSVヘッダー（実際のCSVファイル順序）
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

// 安全なインポート関数（ロールバック機能付き）
async function safeImportCharacterCSV(csvFilePath, options = {}) {
  const { 
    replaceAll = false, 
    dryRun = false,
    confirmBeforeStart = true,
    autoRollbackOnError = true 
  } = options;
  
  console.log('🚀 安全なキャラクターCSVインポート開始');
  console.log(`ファイル: ${csvFilePath}`);
  console.log(`モード: ${replaceAll ? '全置換' : '追加'}, ${dryRun ? 'ドライラン' : '実行'}`);
  console.log(`自動ロールバック: ${autoRollbackOnError ? '有効' : '無効'}`);
  
  let backupData = [];
  let createdRecords = [];
  let importStarted = false;
  
  try {
    // 1. 事前バックアップ（replaceAllの場合）
    if (replaceAll) {
      console.log('\n📋 既存データのバックアップ作成中...');
      const { data: existingCharacters } = await client.models.Character.list({ authMode: 'apiKey' });
      backupData = (existingCharacters || []).filter(c => c !== null);
      console.log(`バックアップ完了: ${backupData.length}件`);
      
      if (backupData.length > 0) {
        // バックアップファイル作成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupFileName = `character_backup_${timestamp}.json`;
        await writeFile(backupFileName, JSON.stringify(backupData, null, 2), 'utf8');
        console.log(`💾 バックアップファイル: ${backupFileName}`);
      }
    }
    
    // 2. CSVファイル読み込みと事前検証
    console.log('\n📖 CSVファイル読み込み中...');
    const csvData = await readCSVFile(csvFilePath);
    
    if (csvData.length === 0) {
      throw new Error('CSVファイルが空です');
    }
    
    console.log(`CSVデータ読み込み完了: ${csvData.length}行`);
    
    // 3. 事前バリデーション
    console.log('\n🔍 事前バリデーション実行中...');
    const validationResult = await validateCSVData(csvData);
    
    if (!validationResult.isValid) {
      console.log('\n❌ バリデーションエラー:');
      validationResult.errors.forEach(error => console.log(`  ${error}`));
      throw new Error(`バリデーション失敗: ${validationResult.errors.length}件のエラー`);
    }
    
    console.log('✅ 事前バリデーション完了');
    
    // 4. 実行確認
    if (confirmBeforeStart && !dryRun) {
      console.log('\n⚠️  インポート実行確認');
      console.log(`処理対象: ${csvData.length}行`);
      console.log(`既存データ: ${backupData.length}件 ${replaceAll ? '(削除される)' : '(保持される)'}`);
      console.log(`自動ロールバック: ${autoRollbackOnError ? '有効' : '無効'}`);
      
      // 実際のプロジェクトでは readline を使用して確認入力を求める
      console.log('\n処理を続行します...');
    }
    
    // 5. 既存データ削除（replaceAllの場合）
    if (replaceAll && !dryRun) {
      console.log('\n🗑️  既存データ削除中...');
      for (const character of backupData) {
        await client.models.Character.delete({ id: character.id });
        console.log(`  削除: ${character.character_id} - ${character.character_name_jp || character.character_name_en}`);
      }
      console.log('既存データ削除完了');
    }
    
    importStarted = true;
    
    // 6. データインポート実行
    console.log('\n💾 データインポート開始...');
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 2; // ヘッダー行を考慮
      
      try {
        // 重複チェック（追加モード時）
        if (!replaceAll) {
          const { data: existingChar } = await client.models.Character.list({
            filter: { character_id: { eq: row.character_id } },
            authMode: 'apiKey'
          });
          
          const validExisting = (existingChar || []).filter(c => c !== null);
          if (validExisting.length > 0) {
            console.log(`⚠️  行${rowNumber}: キャラクターID "${row.character_id}" は既に存在するためスキップ`);
            continue;
          }
        }
        
        // キャラクターデータ作成
        const characterData = {
          character_id: row.character_id.trim(),
          character_name_en: row.character_name_en.trim(),
          character_name_jp: row.character_name_jp ? row.character_name_jp.trim() : null,
          nickname: row.nickname ? row.nickname.trim() : null,
          nationality: row.nationality ? row.nationality.trim() : null,
          height: row.height ? row.height.toString().trim() : null,
          weight: row.weight ? row.weight.toString().trim() : null,
          martial_arts: row.martial_arts ? row.martial_arts.trim() : null,
          character_description: row.character_description ? row.character_description.trim() : null
        };
        
        // データベースに保存
        if (!dryRun) {
          const result = await client.models.Character.create(characterData);
          
          if (result.data) {
            createdRecords.push(result.data);
            successCount++;
            console.log(`✅ 行${rowNumber}: ${characterData.character_name_jp || characterData.character_name_en} 作成完了`);
          } else {
            throw new Error('データ作成に失敗');
          }
        } else {
          successCount++;
          console.log(`✅ 行${rowNumber}: ${characterData.character_name_jp || characterData.character_name_en} [ドライラン]`);
        }
        
      } catch (error) {
        errorCount++;
        const errorMessage = `❌ 行${rowNumber}: ${error.message}`;
        console.error(errorMessage);
        errors.push({ row: rowNumber, error: error.message, data: row });
        
        // エラー時の自動ロールバック判定
        if (autoRollbackOnError && !dryRun) {
          console.log('\n🔴 エラーが発生しました。自動ロールバックを実行します...');
          await rollbackImport(createdRecords, backupData, replaceAll);
          throw new Error(`行${rowNumber}でエラーが発生したため、インポートを中止し、ロールバックしました`);
        }
      }
    }
    
    // 7. 結果サマリー
    console.log('\n📊 インポート結果');
    console.log(`成功: ${successCount}件`);
    console.log(`エラー: ${errorCount}件`);
    console.log(`処理総数: ${csvData.length}件`);
    console.log(`成功率: ${((successCount / csvData.length) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log('\n❌ エラー詳細:');
      errors.slice(0, 5).forEach(error => {
        console.log(`  行${error.row}: ${error.error}`);
      });
      if (errors.length > 5) {
        console.log(`  ... 他${errors.length - 5}件のエラー`);
      }
    }
    
    // 8. 最終確認
    if (!dryRun) {
      const { data: finalCharacters } = await client.models.Character.list({ authMode: 'apiKey' });
      const validFinalCharacters = (finalCharacters || []).filter(c => c !== null);
      console.log(`\n現在の総キャラクター数: ${validFinalCharacters.length}件`);
    }
    
    if (successCount === csvData.length) {
      console.log('\n🎉 すべてのデータが正常にインポートされました！');
    } else if (errorCount === 0) {
      console.log('\n✅ エラーなしでインポート完了（一部スキップあり）');
    } else {
      console.log('\n⚠️  一部エラーがありましたが、インポートは完了しました');
    }
    
  } catch (error) {
    console.error('\n💥 致命的エラー:', error.message);
    
    // エラー時の手動ロールバック提案
    if (importStarted && createdRecords.length > 0 && !dryRun) {
      console.log('\n🔄 ロールバックオプション:');
      console.log('1. 自動ロールバック（推奨）');
      console.log('2. 手動で対処');
      
      // 実際のプロジェクトでは readline で選択肢を提供
      console.log('\n自動ロールバックを実行します...');
      await rollbackImport(createdRecords, backupData, replaceAll);
    }
    
    throw error;
  }
}

// CSVファイル読み込み関数
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

// CSVデータバリデーション関数
async function validateCSVData(csvData) {
  const errors = [];
  const characterIds = new Set();
  
  // ヘッダー確認
  if (csvData.length > 0) {
    const headers = Object.keys(csvData[0]);
    const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      errors.push(`必須ヘッダー不足: ${missingHeaders.join(', ')}`);
    }
  }
  
  // データ検証
  csvData.forEach((row, index) => {
    const rowNumber = index + 2;
    
    // 必須フィールド
    if (!row.character_id || row.character_id.toString().trim() === '') {
      errors.push(`行${rowNumber}: character_id が空`);
    } else {
      // 重複チェック
      if (characterIds.has(row.character_id)) {
        errors.push(`行${rowNumber}: character_id "${row.character_id}" が重複`);
      } else {
        characterIds.add(row.character_id);
      }
    }
    
    if (!row.character_name_en || row.character_name_en.toString().trim() === '') {
      errors.push(`行${rowNumber}: character_name_en が空`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    totalRows: csvData.length,
    uniqueCharacters: characterIds.size
  };
}

// ロールバック関数
async function rollbackImport(createdRecords, backupData, wasReplaceAll) {
  console.log('\n🔄 ロールバック開始...');
  
  try {
    // 作成されたレコードを削除
    if (createdRecords.length > 0) {
      console.log(`作成されたレコードを削除中: ${createdRecords.length}件`);
      for (const record of createdRecords) {
        await client.models.Character.delete({ id: record.id });
        console.log(`  削除: ${record.character_id} - ${record.character_name_jp || record.character_name_en}`);
      }
    }
    
    // バックアップデータを復元（replaceAllの場合）
    if (wasReplaceAll && backupData.length > 0) {
      console.log(`バックアップデータを復元中: ${backupData.length}件`);
      for (const backup of backupData) {
        // id, createdAt, updatedAt を除いてデータを復元
        const restoreData = {
          character_id: backup.character_id,
          character_name_en: backup.character_name_en,
          character_name_jp: backup.character_name_jp,
          nickname: backup.nickname,
          nationality: backup.nationality,
          height: backup.height,
          weight: backup.weight,
          martial_arts: backup.martial_arts,
          character_description: backup.character_description
        };
        
        await client.models.Character.create(restoreData);
        console.log(`  復元: ${backup.character_id} - ${backup.character_name_jp || backup.character_name_en}`);
      }
    }
    
    console.log('✅ ロールバック完了');
    
  } catch (rollbackError) {
    console.error('❌ ロールバック中にエラーが発生:', rollbackError.message);
    console.log('⚠️  手動でデータの整合性を確認してください');
  }
}

// writeFile関数をインポート
const { writeFile } = await import('fs/promises');

// コマンドライン引数処理
const args = process.argv.slice(2);
const command = args[0];
const csvFile = args[1];
const options = {
  replaceAll: args.includes('--replace-all'),
  dryRun: args.includes('--dry-run'),
  noConfirm: args.includes('--no-confirm'),
  noRollback: args.includes('--no-rollback')
};

if (command === 'import' && csvFile) {
  await safeImportCharacterCSV(csvFile, {
    replaceAll: options.replaceAll,
    dryRun: options.dryRun,
    confirmBeforeStart: !options.noConfirm,
    autoRollbackOnError: !options.noRollback
  });
} else {
  console.log('安全なキャラクターCSVインポートスクリプト');
  console.log('');
  console.log('使用方法:');
  console.log('  import <csv>       - CSVファイルをインポート');
  console.log('');
  console.log('オプション:');
  console.log('  --replace-all      - 既存データを全て削除してから追加');
  console.log('  --dry-run          - 実際の処理は行わずテストのみ');
  console.log('  --no-confirm       - 確認なしで実行');
  console.log('  --no-rollback      - 自動ロールバックを無効化');
  console.log('');
  console.log('例:');
  console.log('  node scripts/safe-import-character-csv.js import character.csv');
  console.log('  node scripts/safe-import-character-csv.js import character.csv --replace-all');
  console.log('  node scripts/safe-import-character-csv.js import character.csv --dry-run');
}
