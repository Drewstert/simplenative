import { supabase } from './supabase';

export async function loadGame(userId) {
  const { data, error } = await supabase
    .from('game_saves')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Load failed: ${error.message}`);
  return data;
}

export async function saveGame(userId, game) {
  const save = {
    user_id: userId,
    username: game.username,
    rings: game.rings,
    red_rings: game.redRings,
    upgrade: game.upgrade,
    upgrade_mult: game.upgradeMult,
    rings_per_second: game.ringsPerSec,
    time_stones: game.timeStones,
    rebirths: game.rebirths,
    game_state: game,
    updated_at: new Date().toISOString(),
  };

  const { error: saveError } = await supabase
    .from('game_saves')
    .upsert(save, { onConflict: 'user_id' });

  if (saveError) throw new Error(`Save failed: ${saveError.message}`);

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
