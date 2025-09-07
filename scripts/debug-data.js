// scripts/debug-data.js (新しいスキーマ対応版)
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

async function debugData() {
  console.log('=== データ状況確認開始（新スキーマ対応） ===\n');

  try {
    // 1. キャラクター確認
    console.log('1. キャラクターデータ確認');
    const { data: characters } = await client.models.Character.list();
    const validCharacters = characters.filter(c => c !== null);
    
    console.log(`キャラクター数: ${validCharacters.length}`);
    
    if (validCharacters.length > 0) {
      // サンプルデータの構造確認
      console.log('\nサンプルキャラクターデータ構造:');
      console.log('フィールド:', Object.keys(validCharacters[0]));
      console.log('サンプル:', JSON.stringify(validCharacters[0], null, 2));
      
      console.log('\nキャラクター一覧:');
      validCharacters.forEach(char => {
        // 新しいスキーマのフィールド名を使用
        const charId = char.character_id || 'undefined';
        const charName = char.character_name_jp || char.character_name_en || 'undefined';
        console.log(`  - ${charId}: ${charName}`);
      });
    } else {
      console.log('キャラクターデータが存在しません');
    }
    
    // 2. 技分類確認
    console.log('\n2. 技分類データ確認');
    const { data: categories } = await client.models.MoveCategory.list();
    const validCategories = categories.filter(c => c !== null);
    
    console.log(`技分類数: ${validCategories.length}`);
    
    if (validCategories.length > 0) {
      // サンプルデータの構造確認
      console.log('\nサンプル技分類データ構造:');
      console.log('フィールド:', Object.keys(validCategories[0]));
      console.log('サンプル:', JSON.stringify(validCategories[0], null, 2));
      
      console.log('\n技分類一覧（最初の10件）:');
      validCategories.slice(0, 10).forEach(cat => {
        // 新しいスキーマのフィールド名を使用
        const catId = cat.move_category_id || 'undefined';
        const catName = cat.move_category || 'undefined';
        console.log(`  - ${cat.id}: ${catId} - ${catName}`);
      });
      
      if (validCategories.length > 10) {
        console.log(`  ... 他${validCategories.length - 10}件`);
      }
    } else {
      console.log('技分類データが存在しません');
    }
    
    // 3. 技データ確認
    console.log('\n3. 技データ確認');
    const { data: moves } = await client.models.Move.list();
    const validMoves = moves.filter(m => m !== null);
    
    console.log(`全技数: ${validMoves.length}`);
    
    if (validMoves.length > 0) {
      // サンプルデータの構造確認
      console.log('\nサンプル技データ構造:');
      console.log('フィールド:', Object.keys(validMoves[0]));
      console.log('サンプル:', JSON.stringify(validMoves[0], null, 2));
      
      // キャラクター別技数
      const movesByCharacter = {};
      validMoves.forEach(move => {
        const charId = move.character_id || 'undefined';
        if (!movesByCharacter[charId]) {
          movesByCharacter[charId] = [];
        }
        movesByCharacter[charId].push(move);
      });
      
      console.log('\nキャラクター別技数:');
      Object.entries(movesByCharacter).forEach(([charId, moves]) => {
        const character = validCharacters.find(c => c.character_id === charId);
        const charName = character ? 
          (character.character_name_jp || character.character_name_en) : 
          '不明';
        console.log(`  ${charId} (${charName}): ${moves.length}技`);
      });
    }
    
    // 4. データ整合性チェック
    console.log('\n4. データ整合性チェック');
    
    // キャラクターIDの整合性
    console.log('キャラクターデータ整合性:');
    const charactersWithId = validCharacters.filter(c => c.character_id);
    const charactersWithoutId = validCharacters.filter(c => !c.character_id);
    console.log(`  character_id あり: ${charactersWithId.length}件`);
    console.log(`  character_id なし: ${charactersWithoutId.length}件`);
    
    // 技分類IDの整合性
    console.log('\n技分類データ整合性:');
    const categoriesWithId = validCategories.filter(c => c.move_category_id);
    const categoriesWithoutId = validCategories.filter(c => !c.move_category_id);
    console.log(`  move_category_id あり: ${categoriesWithId.length}件`);
    console.log(`  move_category_id なし: ${categoriesWithoutId.length}件`);
    
    // 5. 推奨対応策
    console.log('\n5. 推奨対応策:');
    
    if (charactersWithoutId.length > 0) {
      console.log('❌ 一部のキャラクターでcharacter_idが未設定です');
      console.log('対策: キャラクターマスタを新しいスキーマで再作成してください');
      console.log('  npm run character-csv template');
      console.log('  npm run character-csv import character.csv --replace-all');
    }
    
    if (categoriesWithoutId.length > 0) {
      console.log('❌ 一部の技分類でmove_category_idが未設定です');
      console.log('対策: 技分類マスタを新しいスキーマで再作成してください');
      console.log('  npm run move-category-csv template');
      console.log('  npm run move-category-csv import category.csv --replace-all');
    }
    
    if (charactersWithId.length > 0 && categoriesWithId.length > 0) {
      console.log('✅ データ整合性OK - 技データのインポートが可能です');
      console.log('\n利用可能なキャラクターID:');
      charactersWithId.slice(0, 5).forEach(char => {
        console.log(`  - ${char.character_id}: ${char.character_name_jp || char.character_name_en}`);
      });
      
      console.log('\n利用可能な技分類ID（例）:');
      categoriesWithId.slice(0, 5).forEach(cat => {
        console.log(`  - ${cat.move_category_id}: ${cat.move_category}`);
      });
    }
    
    console.log('\n=== 確認完了 ===');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

debugData();