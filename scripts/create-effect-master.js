// scripts/create-effect-master.js
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

// エフェクトマスタデータ
const EFFECT_MASTER_DATA = [
  {
    effectId: '1',
    effectName: 'ホーミング',
    iconFileName: 'HO.png',
    description: '相手の横移動に対して有効な技です'
  },
  {
    effectId: '2', 
    effectName: 'トルネード誘発',
    iconFileName: 'TR.png',
    description: '空中の相手にヒットすると追撃しやすくなる技です'
  },
  {
    effectId: '3',
    effectName: 'パワークラッシュ',
    iconFileName: 'PC.png',
    description: '相手の上・中段攻撃を受け止めながら攻撃できる技です'
  },
  {
    effectId: '4',
    effectName: '回復ゲージ消滅',
    iconFileName: 'GV.png',
    description: '相手にヒットすると残っている回復可能ゲージを消滅させる技です'
  },
  {
    effectId: '5',
    effectName: 'ヒート発動技',
    iconFileName: 'HT.png',
    description: '地上の相手にヒットするとヒート状態になる技です'
  },
  {
    effectId: '6',
    effectName: 'ウォールブレイク',
    iconFileName: 'WB.png',
    description: '特定の壁を破壊し追撃が可能となる技です'
  },
  {
    effectId: '7',
    effectName: 'フロアブレイク',
    iconFileName: 'FB.png',
    description: '特定の床を破壊し追撃が可能となる技です'
  },
  {
    effectId: '8',
    effectName: '強制しゃがみ',
    iconFileName: 'KS.png',
    description: '地上の相手にヒットすると相手をしゃがみ状態にする技です'
  }
];

async function createEffectMaster() {
  console.log('エフェクトマスタ作成開始...');

  try {
    // 既存のエフェクトマスタを削除
    const { data: existingEffects } = await client.models.Effect.list({ authMode: 'apiKey' });
    const validExistingEffects = (existingEffects || []).filter(e => e !== null);
    
    if (validExistingEffects.length > 0) {
      console.log(`既存エフェクト ${validExistingEffects.length} 件を削除中...`);
      for (const effect of validExistingEffects) {
        await client.models.Effect.delete({ id: effect.id });
      }
      console.log('既存エフェクト削除完了');
    }

    // 新しいエフェクトマスタを作成
    console.log('新しいエフェクトマスタを作成中...');
    
    for (const effectData of EFFECT_MASTER_DATA) {
      try {
        const result = await client.models.Effect.create({
          imagePath: `/effect-icons/${effectData.iconFileName}`
        });
        
        console.log(`✓ エフェクト作成: ${effectData.effectId} - ${effectData.effectName} (${effectData.iconFileName})`);
      } catch (error) {
        console.error(`❌ エフェクト作成失敗: ${effectData.effectId} - ${error.message}`);
      }
    }

    // 作成結果確認
    const { data: newEffects } = await client.models.Effect.list({ authMode: 'apiKey' });
    const validNewEffects = (newEffects || []).filter(e => e !== null);
    
    console.log('\n=== 作成完了 ===');
    console.log(`エフェクト数: ${validNewEffects.length}`);
    
    validNewEffects.forEach((effect, index) => {
      const effectData = EFFECT_MASTER_DATA[index];
      console.log(`  ${index + 1}. ${effect.imagePath} (ID: ${effect.id})`);
    });

    console.log('\n🎉 エフェクトマスタ作成完了！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

createEffectMaster();