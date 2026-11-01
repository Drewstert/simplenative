import { supabase } from './supabase';

export async function loadGame(userId) {
  const [saveResult, redResult, characterResult, activeResult, costResult] = await Promise.all([
    supabase.from('game_saves').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('red_upgrades').select('*').eq('user_id', userId),
    supabase.from('owned_characters').select('*').eq('user_id', userId),
    supabase.from('active_upgrades').select('*').eq('user_id', userId),
    supabase.from('active_upgrade_costs').select('*').eq('user_id', userId),
  ]);

  if (saveResult.error) throw new Error(`Load failed: ${saveResult.error.message}`);
  if (redResult.error) throw new Error(`Red upgrade load failed: ${redResult.error.message}`);
  if (characterResult.error) throw new Error(`Character load failed: ${characterResult.error.message}`);
  if (activeResult.error) throw new Error(`Active upgrade load failed: ${activeResult.error.message}`);
  if (costResult.error) throw new Error(`Upgrade cost load failed: ${costResult.error.message}`);
  if (!saveResult.data) return null;

  return {
    ...saveResult.data,
    game_state: {
      username: saveResult.data.username,
      rings: saveResult.data.rings,
      redRings: saveResult.data.red_rings,
      upgrade: saveResult.data.upgrade,
      upgradeMult: saveResult.data.upgrade_mult,
      baseMult: saveResult.data.base_mult,
      ringsPerSec: saveResult.data.rings_per_second,
      redDrop: saveResult.data.red_drop,
      rngRed: saveResult.data.rng_red,
      clickRedRate: saveResult.data.click_red_rate,
      tickSpeed: saveResult.data.tick_speed,
      timeStones: saveResult.data.time_stones,
      timePrice: saveResult.data.time_price,
      rebirths: saveResult.data.rebirths,
      selectedZone: saveResult.data.selected_zone,
      superMult: saveResult.data.super_mult,
      redUpgrades: Object.fromEntries(
        (redResult.data || []).map(({ upgrade_key, price, level, stock }) => [
          upgrade_key,
          { price, level, stock },
        ]),
      ),
      ownedCharacters: (characterResult.data || []).map(({ character_name, color, count, cost, gain }) => ({
        name: character_name,
        color,
        count,
        cost,
        gain,
      })),
      activeUpgradeLevels: Object.fromEntries(
        (activeResult.data || []).map(({ upgrade_name, level }) => [upgrade_name, level]),
      ),
      activeUpgradeCosts: Object.fromEntries(
        (costResult.data || []).map(({ upgrade_name, cost }) => [upgrade_name, cost]),
      ),
    },
  };
}

export async function saveGame(userId, game) {
  const save = {
    user_id: userId,
    username: game.username,
    rings: game.rings,
    red_rings: game.redRings,
    upgrade: game.upgrade,
    upgrade_mult: game.upgradeMult,
    base_mult: game.baseMult,
    rings_per_second: game.ringsPerSec,
    red_drop: game.redDrop,
    rng_red: game.rngRed,
    click_red_rate: game.clickRedRate,
    tick_speed: game.tickSpeed,
    time_stones: game.timeStones,
    time_price: game.timePrice,
    rebirths: game.rebirths,
    selected_zone: game.selectedZone,
    super_mult: game.superMult,
    updated_at: new Date().toISOString(),
  };

  const { error: saveError } = await supabase
    .from('game_saves')
    .upsert(save, { onConflict: 'user_id' });

  if (saveError) throw new Error(`Save failed: ${saveError.message}`);

  const { error: redDeleteError } = await supabase.from('red_upgrades').delete().eq('user_id', userId);
  if (redDeleteError) throw new Error(`Red upgrade reset failed: ${redDeleteError.message}`);
  const { error: characterDeleteError } = await supabase.from('owned_characters').delete().eq('user_id', userId);
  if (characterDeleteError) throw new Error(`Character reset failed: ${characterDeleteError.message}`);
  const { error: costDeleteError } = await supabase.from('active_upgrade_costs').delete().eq('user_id', userId);
  if (costDeleteError) throw new Error(`Upgrade cost reset failed: ${costDeleteError.message}`);
  const { error: activeDeleteError } = await supabase.from('active_upgrades').delete().eq('user_id', userId);
  if (activeDeleteError) throw new Error(`Active upgrade reset failed: ${activeDeleteError.message}`);

  const { error: redInsertError } = await supabase.from('red_upgrades').insert(
    Object.entries(game.redUpgrades).map(([upgrade_key, upgrade]) => ({
      user_id: userId,
      upgrade_key,
      price: upgrade.price,
      level: upgrade.level || null,
      stock: upgrade.stock ?? null,
    })),
  );
  if (redInsertError) throw new Error(`Red upgrade save failed: ${redInsertError.message}`);

  const { error: characterInsertError } = await supabase.from('owned_characters').insert(
    game.ownedCharacters.map((character) => ({
      user_id: userId,
      character_name: character.name,
      color: character.color,
      count: character.count,
      cost: character.cost,
      gain: character.gain,
    })),
  );
  if (characterInsertError) throw new Error(`Character save failed: ${characterInsertError.message}`);

  const { error: costInsertError } = await supabase.from('active_upgrade_costs').insert(
    Object.entries(game.activeUpgradeCosts).map(([upgrade_name, cost]) => ({
      user_id: userId,
      upgrade_name,
      cost,
    })),
  );
  if (costInsertError) throw new Error(`Upgrade cost save failed: ${costInsertError.message}`);

  const { error: activeInsertError } = await supabase.from('active_upgrades').insert(
    Object.entries(game.activeUpgradeLevels).map(([upgrade_name, level]) => ({
      user_id: userId,
      upgrade_name,
      level,
    })),
  );
  if (activeInsertError) throw new Error(`Active upgrade save failed: ${activeInsertError.message}`);

  const { error: leaderboardError } = await supabase
    .from('leaderboard')
    .upsert({
      user_id: userId,
      username: game.username,
      rings: game.rings,
      rebirths: game.rebirths,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (leaderboardError) throw new Error(`Leaderboard update failed: ${leaderboardError.message}`);
}

export async function loadLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('username, rings, rebirths')
    .order('rings', { ascending: false })
    .limit(25);

  if (error) throw new Error(`Leaderboard load failed: ${error.message}`);
  return data || [];
}
