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

async function addEffectsToExistingMoves() {
  console.log('既存技にエフェクトを追加中...');
  
  try {
    const { data: moves } = await client.models.Move.list({ authMode: 'apiKey' });
    const validMoves = moves.filter(m => m !== null);
    
    for (const move of validMoves) {
      // 技名に基づいてエフェクトを追加（例）
      let effectsToAdd = [];
      
      if (move.name.includes('風神拳')) {
        effectsToAdd = ['1', '3']; // ホーミング + パワークラッシュ
      } else if (move.name.includes('ジャブ')) {
        effectsToAdd = ['1']; // ホーミング
      } else if (move.name.includes('キック')) {
        effectsToAdd = ['2']; // トルネード誘発
      }
      
      if (effectsToAdd.length > 0) {
        await client.models.Move.update({
          id: move.id,
          effects: effectsToAdd
        });
        console.log(`✓ ${move.name} にエフェクト追加: ${effectsToAdd.join(', ')}`);
      }
    }
    
    console.log('エフェクト追加完了！');
  } catch (error) {
    console.error('エラー:', error);
  }
}

addEffectsToExistingMoves();