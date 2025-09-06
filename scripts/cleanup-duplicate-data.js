// scripts/cleanup-duplicate-data.js
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

async function cleanupDuplicateData() {
  console.log('重複データクリーンアップ開始...');

  try {
    // 1. 重複キャラクターの削除
    console.log('\n=== 重複キャラクター削除 ===');
    const { data: characters } = await client.models.Character.list();
    const validCharacters = characters.filter(c => c !== null);
    
    const characterMap = new Map();
    const duplicateCharacters = [];
    
    validCharacters.forEach(char => {
      const key = char.characterId;
      if (characterMap.has(key)) {
        duplicateCharacters.push(char);
      } else {
        characterMap.set(key, char);
      }
    });
    
    console.log(`重複キャラクター数: ${duplicateCharacters.length}`);
    for (const char of duplicateCharacters) {
      await client.models.Character.delete({ id: char.id });
      console.log(`✓ 削除: ${char.characterId} - ${char.name} (ID: ${char.id})`);
    }
    
    // 2. 重複技分類の削除
    console.log('\n=== 重複技分類削除 ===');
    const { data: categories } = await client.models.MoveCategory.list();
    const validCategories = categories.filter(c => c !== null);
    
    const categoryMap = new Map();
    const duplicateCategories = [];
    const keepCategories = new Map();
    
    validCategories.forEach(cat => {
      const key = cat.categoryName;
      if (categoryMap.has(key)) {
        duplicateCategories.push(cat);
      } else {
        categoryMap.set(key, cat);
        keepCategories.set(key, cat.id);
      }
    });
    
    console.log(`重複技分類数: ${duplicateCategories.length}`);
    for (const cat of duplicateCategories) {
      await client.models.MoveCategory.delete({ id: cat.id });
      console.log(`✓ 削除: ${cat.categoryName} (ID: ${cat.id})`);
    }
    
    // 3. 技データのcategoryId更新
    console.log('\n=== 技データのcategoryId更新 ===');
    const { data: moves } = await client.models.Move.list();
    const validMoves = moves.filter(m => m !== null);
    
    console.log('保持する技分類マップ:');
    keepCategories.forEach((id, name) => {
      console.log(`  ${name}: ${id}`);
    });
    
    for (const move of validMoves) {
      // 現在のcategoryIdが削除されたものかチェック
      const currentCategory = validCategories.find(c => c.id === move.categoryId);
      
      if (!currentCategory) {
        console.log(`⚠ 技 ${move.name} のカテゴリIDが無効: ${move.categoryId}`);
        continue;
      }
      
      const correctCategoryId = keepCategories.get(currentCategory.categoryName);
      
      if (move.categoryId !== correctCategoryId) {
        console.log(`更新: ${move.name} - ${currentCategory.categoryName}`);
        console.log(`  ${move.categoryId} → ${correctCategoryId}`);
        
        await client.models.Move.update({
          id: move.id,
          categoryId: correctCategoryId
        });
      }
    }
    
    // 4. 最終確認
    console.log('\n=== 最終確認 ===');
    const { data: finalCharacters } = await client.models.Character.list();
    const { data: finalCategories } = await client.models.MoveCategory.list();
    const { data: finalMoves } = await client.models.Move.list();
    
    const validFinalCharacters = finalCharacters.filter(c => c !== null);
    const validFinalCategories = finalCategories.filter(c => c !== null);
    const validFinalMoves = finalMoves.filter(m => m !== null);
    
    console.log(`キャラクター数: ${validFinalCharacters.length}`);
    validFinalCharacters.forEach(char => {
      console.log(`  - ${char.characterId}: ${char.name}`);
    });
    
    console.log(`技分類数: ${validFinalCategories.length}`);
    validFinalCategories.forEach(cat => {
      console.log(`  - ${cat.categoryName}: ${cat.id}`);
    });
    
    console.log(`技数: ${validFinalMoves.length}`);
    
    // キャラクター別・技分類別技数
    const jin = validFinalCharacters.find(c => c.characterId === '001');
    if (jin) {
      const jinMoves = validFinalMoves.filter(m => m.characterId === '001');
      console.log(`\n風間仁の技数: ${jinMoves.length}`);
      
      const movesByCategory = new Map();
      jinMoves.forEach(move => {
        const cat = validFinalCategories.find(c => c.id === move.categoryId);
        const categoryName = cat?.categoryName || '不明';
        
        if (!movesByCategory.has(categoryName)) {
          movesByCategory.set(categoryName, []);
        }
        movesByCategory.get(categoryName).push(move);
      });
      
      movesByCategory.forEach((moves, categoryName) => {
        console.log(`  ${categoryName}: ${moves.length}技`);
        moves.forEach(move => {
          console.log(`    - ${move.name}: ${move.command || 'コマンドなし'}`);
        });
      });
    }
    
    console.log('\n🎉 クリーンアップ完了！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

cleanupDuplicateData();