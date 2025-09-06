// scripts/debug-data.js
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
  console.log('=== データ状況確認開始 ===\n');

  try {
    // 1. キャラクター確認
    console.log('1. キャラクターデータ確認');
    const { data: characters } = await client.models.Character.list();
    const validCharacters = characters.filter(c => c !== null);
    
    console.log(`キャラクター数: ${validCharacters.length}`);
    validCharacters.forEach(char => {
      console.log(`  - ${char.characterId}: ${char.name}`);
    });
    
    // 2. 技分類確認
    console.log('\n2. 技分類データ確認');
    const { data: categories } = await client.models.MoveCategory.list();
    const validCategories = categories.filter(c => c !== null);
    
    console.log(`技分類数: ${validCategories.length}`);
    validCategories.forEach(cat => {
      console.log(`  - ${cat.id}: ${cat.categoryName}`);
    });
    
    // 3. 技データ確認
    console.log('\n3. 技データ確認');
    const { data: moves } = await client.models.Move.list();
    const validMoves = moves.filter(m => m !== null);
    
    console.log(`全技数: ${validMoves.length}`);
    
    // キャラクター別技数
    const movesByCharacter = {};
    validMoves.forEach(move => {
      if (!movesByCharacter[move.characterId]) {
        movesByCharacter[move.characterId] = [];
      }
      movesByCharacter[move.characterId].push(move);
    });
    
    Object.entries(movesByCharacter).forEach(([charId, moves]) => {
      const character = validCharacters.find(c => c.characterId === charId);
      console.log(`  ${charId} (${character?.name || '不明'}): ${moves.length}技`);
      
      moves.forEach(move => {
        console.log(`    - ${move.moveId}: ${move.name} (category: ${move.categoryId})`);
      });
    });
    
    // 4. 技分類別確認
    console.log('\n4. 技分類別技数確認');
    const movesByCategory = {};
    validMoves.forEach(move => {
      if (!movesByCategory[move.categoryId]) {
        movesByCategory[move.categoryId] = [];
      }
      movesByCategory[move.categoryId].push(move);
    });
    
    Object.entries(movesByCategory).forEach(([catId, moves]) => {
      const category = validCategories.find(c => c.id === catId);
      console.log(`  ${catId} (${category?.categoryName || '不明'}): ${moves.length}技`);
    });
    
    // 5. 特定の組み合わせ確認（風間仁 + 打撃技）
    console.log('\n5. 特定組み合わせ確認');
    const jinCharacter = validCharacters.find(c => c.characterId === '001');
    const strikeCategory = validCategories.find(c => c.categoryName === '打撃技');
    
    if (jinCharacter && strikeCategory) {
      console.log(`風間仁 (${jinCharacter.characterId}) + 打撃技 (${strikeCategory.id})`);
      
      const jinStrikeMoves = validMoves.filter(move => 
        move.characterId === '001' && move.categoryId === strikeCategory.id
      );
      
      console.log(`該当技数: ${jinStrikeMoves.length}`);
      jinStrikeMoves.forEach(move => {
        console.log(`  - ${move.name}: ${move.command || 'コマンドなし'}`);
      });
    }
    
    console.log('\n=== 確認完了 ===');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

debugData();