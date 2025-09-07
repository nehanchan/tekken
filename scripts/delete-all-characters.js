// scripts/delete-all-characters.js
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFile } from 'fs/promises';
import { createInterface } from 'readline';

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

// readline インターフェース作成
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// プロンプト関数
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 既存キャラクター確認関数
async function listExistingCharacters() {
  console.log('既存キャラクターデータを確認中...');
  
  try {
    const { data: characters } = await client.models.Character.list({ authMode: 'apiKey' });
    const validCharacters = (characters || []).filter(c => c !== null);
    
    console.log(`\n=== 現在登録されているキャラクター (${validCharacters.length}件) ===`);
    
    if (validCharacters.length === 0) {
      console.log('キャラクターデータは登録されていません');
      return [];
    }
    
    validCharacters
      .sort((a, b) => a.character_id.localeCompare(b.character_id))
      .forEach((char, index) => {
        console.log(`${index + 1}. ${char.character_id}: ${char.character_name_jp || char.character_name_en} (${char.character_name_en})`);
        if (char.nickname) {
          console.log(`   称号: ${char.nickname}`);
        }
        console.log(`   作成日: ${new Date(char.createdAt).toLocaleString('ja-JP')}`);
        console.log('');
      });
      
    return validCharacters;
    
  } catch (error) {
    console.error('❌ キャラクターデータ取得エラー:', error);
    throw error;
  }
}

// 関連データチェック関数
async function checkRelatedData() {
  console.log('関連データを確認中...');
  
  try {
    // 技データの確認
    const { data: moves } = await client.models.Move.list({ authMode: 'apiKey' });
    const validMoves = (moves || []).filter(m => m !== null);
    
    console.log(`\n=== 関連データ確認 ===`);
    console.log(`技データ: ${validMoves.length}件`);
    
    if (validMoves.length > 0) {
      // キャラクター別技数
      const movesByCharacter = new Map();
      validMoves.forEach(move => {
        const charId = move.character_id;
        if (!movesByCharacter.has(charId)) {
          movesByCharacter.set(charId, 0);
        }
        movesByCharacter.set(charId, movesByCharacter.get(charId) + 1);
      });
      
      console.log('\nキャラクター別技数:');
      Array.from(movesByCharacter.entries()).forEach(([charId, count]) => {
        console.log(`  ${charId}: ${count}技`);
      });
      
      console.log('\n⚠ 注意: キャラクターを削除すると、関連する技データとの整合性が取れなくなる可能性があります');
    }
    
    return validMoves.length;
    
  } catch (error) {
    console.error('❌ 関連データ確認エラー:', error);
    return 0;
  }
}

// キャラクター全削除関数
async function deleteAllCharacters(force = false) {
  try {
    // 既存データ確認
    const existingCharacters = await listExistingCharacters();
    
    if (existingCharacters.length === 0) {
      console.log('削除対象のキャラクターがありません');
      rl.close();
      return;
    }
    
    // 関連データ確認
    const relatedMovesCount = await checkRelatedData();
    
    // 確認プロンプト
    if (!force) {
      console.log('\n⚠⚠⚠ 重要な警告 ⚠⚠⚠');
      console.log('この操作により、以下のデータが完全に削除されます:');
      console.log(`- キャラクターデータ: ${existingCharacters.length}件`);
      
      if (relatedMovesCount > 0) {
        console.log(`\n関連する技データ (${relatedMovesCount}件) は削除されませんが、`);
        console.log('キャラクター参照が無効になります。');
      }
      
      console.log('\nこの操作は取り消すことができません！\n');
      
      const confirm1 = await question('本当にすべてのキャラクターデータを削除しますか？ (yes/no): ');
      
      if (confirm1.toLowerCase() !== 'yes') {
        console.log('キャンセルしました');
        rl.close();
        return;
      }
      
      const confirm2 = await question('最終確認: 本当に削除を実行しますか？ (DELETE/cancel): ');
      
      if (confirm2 !== 'DELETE') {
        console.log('キャンセルしました');
        rl.close();
        return;
      }
    }
    
    // 削除実行
    console.log('\n削除処理を開始します...');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const character of existingCharacters) {
      try {
        await client.models.Character.delete({ id: character.id });
        successCount++;
        console.log(`✓ 削除完了: ${character.character_id} - ${character.character_name_jp || character.character_name_en}`);
      } catch (error) {
        errorCount++;
        const errorMessage = `❌ 削除失敗: ${character.character_id} - ${error.message}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }
    
    // 結果表示
    console.log('\n=== 削除結果 ===');
    console.log(`成功: ${successCount}件`);
    console.log(`失敗: ${errorCount}件`);
    console.log(`削除対象: ${existingCharacters.length}件`);
    
    if (errors.length > 0) {
      console.log('\n=== エラー詳細 ===');
      errors.forEach(error => console.log(error));
    }
    
    // 最終確認
    const { data: remainingCharacters } = await client.models.Character.list({ authMode: 'apiKey' });
    const validRemainingCharacters = (remainingCharacters || []).filter(c => c !== null);
    
    console.log(`\n現在のキャラクター数: ${validRemainingCharacters.length}件`);
    
    if (validRemainingCharacters.length === 0) {
      console.log('🎉 すべてのキャラクターデータが削除されました');
    } else {
      console.log('⚠ 一部のキャラクターデータが残っています:');
      validRemainingCharacters.forEach(char => {
        console.log(`  - ${char.character_id}: ${char.character_name_jp || char.character_name_en}`);
      });
    }
    
    console.log('\n次の手順:');
    console.log('1. 新しいキャラクターCSVファイルを準備');
    console.log('2. バリデーション: npm run character-csv validate <CSVファイル>');
    console.log('3. インポート: npm run character-csv import <CSVファイル>');
    
  } catch (error) {
    console.error('❌ 削除処理エラー:', error);
  } finally {
    rl.close();
  }
}

// 削除前のバックアップ関数
async function backupCharacters() {
  console.log('キャラクターデータのバックアップを作成中...');
  
  try {
    const { data: characters } = await client.models.Character.list({ authMode: 'apiKey' });
    const validCharacters = (characters || []).filter(c => c !== null);
    
    if (validCharacters.length === 0) {
      console.log('バックアップ対象のキャラクターがありません');
      return;
    }
    
    // CSVヘッダー
    const headers = [
      'character_id',
      'character_name_en',
      'character_name_jp',
      'nickname',
      'height',
      'weight',
      'nationality',
      'martial_arts',
      'character_description',
      'createdAt',
      'updatedAt'
    ];
    
    // CSVデータ作成
    const csvLines = [headers.join(',')];
    
    validCharacters
      .sort((a, b) => a.character_id.localeCompare(b.character_id))
      .forEach(char => {
        const row = headers.map(header => {
          let value = char[header];
          if (value === null || value === undefined) return '';
          
          // 文字列のエスケープ
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvLines.push(row.join(','));
      });
    
    // ファイル名（タイムスタンプ付き）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `character_backup_${timestamp}.csv`;
    
    // ファイル出力
    const { writeFile } = await import('fs/promises');
    await writeFile(backupFileName, csvLines.join('\n'), 'utf8');
    
    console.log(`✓ バックアップファイル作成完了: ${backupFileName}`);
    console.log(`キャラクター数: ${validCharacters.length}件`);
    
    return backupFileName;
    
  } catch (error) {
    console.error('❌ バックアップ作成エラー:', error);
    throw error;
  }
}

// コマンドライン引数処理
const args = process.argv.slice(2);
const command = args[0];
const options = {
  force: args.includes('--force'),
  backup: args.includes('--backup')
};

switch (command) {
  case 'list':
    await listExistingCharacters();
    rl.close();
    break;
    
  case 'check':
    await listExistingCharacters();
    await checkRelatedData();
    rl.close();
    break;
    
  case 'backup':
    await backupCharacters();
    rl.close();
    break;
    
  case 'delete':
    if (options.backup) {
      await backupCharacters();
    }
    await deleteAllCharacters(options.force);
    break;
    
  default:
    console.log('キャラクターマスタ削除スクリプト');
    console.log('');
    console.log('使用方法:');
    console.log('  list    - 現在のキャラクター一覧を表示');
    console.log('  check   - キャラクターと関連データを確認');
    console.log('  backup  - キャラクターデータをCSVでバックアップ');
    console.log('  delete  - すべてのキャラクターを削除（要確認）');
    console.log('');
    console.log('オプション:');
    console.log('  --force   - 確認なしで削除実行');
    console.log('  --backup  - 削除前に自動バックアップ');
    console.log('');
    console.log('例:');
    console.log('  node scripts/delete-all-characters.js list');
    console.log('  node scripts/delete-all-characters.js check');
    console.log('  node scripts/delete-all-characters.js backup');
    console.log('  node scripts/delete-all-characters.js delete');
    console.log('  node scripts/delete-all-characters.js delete --backup');
    console.log('');
    console.log('⚠ 注意: delete コマンドは取り消せない操作です！');
    rl.close();
}