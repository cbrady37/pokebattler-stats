import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const localStatsFiles = {
  game: 'C:/Users/Cory/Documents/coding/pokemon_stats.json',
  video: 'C:/Users/Cory/Documents/coding/pokemon_video_stats.json',
};

const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const timestamp = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + ' ' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(':');
};

const blankStat = () => ({
  battles: 0,
  wins: 0,
  kos: 0,
  deaths: 0,
  finishes: 0,
  damage_dealt: 0,
  damage_taken: 0,
  hits: 0,
  best_hit: 0,
  death_rank_total: 0,
  death_rank_count: 0,
  time_alive_total: 0,
  battle_time_total: 0,
  damage_by_type: {},
  move_pool_count: 0,
  move_picks: {},
});

const blankStatsRoot = () => ({ version: 2, overall: {}, by_mode: {} });

const blankFightStatsRoot = () => ({
  ...blankStatsRoot(),
  entries: [],
  leaderboards: {
    youtube: blankStatsRoot(),
    solo: blankStatsRoot(),
  },
});

const statsBucket = (root, modeName = null) => {
  if (!modeName) return root.overall;
  root.by_mode[modeName] ??= {};
  return root.by_mode[modeName];
};

const statRow = (bucket, name) => {
  bucket[name] ??= blankStat();
  return bucket[name];
};

const addToStatRow = (bucket, name, key, amount = 1) => {
  const row = statRow(bucket, name);
  row[key] = number(row[key]) + number(amount);
};

const addEntryMetricsToBucket = (bucket, fighter) => {
  const name = fighter?.name;
  if (!name) return;

  const row = statRow(bucket, name);
  row.damage_dealt = Math.round((number(row.damage_dealt) + number(fighter.damage_dealt)) * 10) / 10;
  row.damage_taken = Math.round((number(row.damage_taken) + number(fighter.damage_taken)) * 10) / 10;
  row.hits = number(row.hits) + number(fighter.hits);
  row.best_hit = Math.round(Math.max(number(row.best_hit), number(fighter.best_hit)) * 10) / 10;
  row.time_alive_total = Math.round((number(row.time_alive_total) + number(fighter.time_alive)) * 100) / 100;
  row.battle_time_total = Math.round((number(row.battle_time_total) + number(fighter.battle_time)) * 100) / 100;

  const deathRank = number(fighter.death_rank);
  if (deathRank) {
    row.death_rank_total = number(row.death_rank_total) + deathRank;
    row.death_rank_count = number(row.death_rank_count) + 1;
  }

  row.damage_by_type ??= {};
  Object.entries(fighter.damage_by_type ?? {}).forEach(([typeName, amount]) => {
    if (number(amount)) {
      row.damage_by_type[typeName] = Math.round((number(row.damage_by_type[typeName]) + number(amount)) * 10) / 10;
    }
  });
};

const addEntryMovePoolToBucket = (bucket, fighter) => {
  const name = fighter?.name;
  if (!name || fighter.move_pool_stat_counted === false || !Array.isArray(fighter.move_pool) || !fighter.move_pool.length) {
    return;
  }

  const row = statRow(bucket, name);
  row.move_picks ??= {};
  let counted = false;
  const seen = new Set();
  fighter.move_pool.forEach((move) => {
    const moveName = move?.name;
    if (!moveName || seen.has(moveName)) return;
    seen.add(moveName);
    const existing = row.move_picks[moveName];
    const picked = existing && typeof existing === 'object'
      ? existing
      : { count: number(existing), type: move.type || 'normal' };
    picked.count = number(picked.count) + 1;
    picked.type = move.type || picked.type || 'normal';
    row.move_picks[moveName] = picked;
    counted = true;
  });
  if (counted) row.move_pool_count = number(row.move_pool_count) + 1;
};

const isExcludedFightEntry = (entry) => {
  const status = entry?.stat_status ?? entry?.video_status ?? 'active';
  return ['excluded', 'deleted', 'broken'].includes(String(status).toLowerCase());
};

const fightEntryGroups = (entry) => {
  const groups = new Set(Array.isArray(entry?.stat_groups) ? entry.stat_groups : []);
  if (entry?.video_status === 'included') groups.add('youtube');
  return [...groups].filter((group) => ['youtube', 'solo'].includes(group));
};

const accumulateFightEntry = (root, entry) => {
  const modeName = entry?.mode || 'unknown';
  const winnerNames = new Set(entry?.winners ?? (entry?.winner ? [entry.winner] : []));

  (Array.isArray(entry?.fighters) ? entry.fighters : []).forEach((fighter) => {
    if (!fighter?.name) return;
    const isWinner = winnerNames.has(fighter.name) || Boolean(fighter.winner);
    const died = fighter.alive ? 0 : 1;

    [statsBucket(root), statsBucket(root, modeName)].forEach((bucket) => {
      addToStatRow(bucket, fighter.name, 'battles');
      addToStatRow(bucket, fighter.name, 'kos', fighter.kos);
      addToStatRow(bucket, fighter.name, 'deaths', died);
      addEntryMetricsToBucket(bucket, fighter);
      addEntryMovePoolToBucket(bucket, fighter);
      if (isWinner) {
        addToStatRow(bucket, fighter.name, 'wins');
        if (number(fighter.kos) > 0) addToStatRow(bucket, fighter.name, 'finishes');
      }
    });
  });
};

const rebuildFightStatsFromEntries = (root = {}) => {
  const rebuilt = blankFightStatsRoot();
  rebuilt.entries = Array.isArray(root.entries) ? root.entries : [];
  rebuilt.entries.forEach((entry) => {
    if (!entry || isExcludedFightEntry(entry)) return;
    accumulateFightEntry(rebuilt, entry);
    fightEntryGroups(entry).forEach((group) => accumulateFightEntry(rebuilt.leaderboards[group], entry));
  });
  return rebuilt;
};

const getFightEntryKey = (entry) => [
  entry?.id ?? '',
  entry?.saved_at ?? '',
  entry?.mode ?? '',
  entry?.winner ?? '',
  Array.isArray(entry?.fighters) ? entry.fighters.map((fighter) => fighter?.name).filter(Boolean).join(',') : '',
].join('|');

const readRequestJson = (request) => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1024 * 1024) {
      reject(new Error('Request body is too large.'));
      request.destroy();
    }
  });
  request.on('end', () => {
    try {
      resolve(body ? JSON.parse(body) : {});
    } catch (error) {
      reject(error);
    }
  });
  request.on('error', reject);
});

const sendJson = (response, statusCode, payload) => {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
};

const getMutableFightStats = (statsRoot) => {
  if (statsRoot?.fight_stats && typeof statsRoot.fight_stats === 'object') {
    return { target: statsRoot.fight_stats, replace: (rebuilt) => { statsRoot.fight_stats = rebuilt; } };
  }
  if (Array.isArray(statsRoot?.entries)) {
    return { target: statsRoot, replace: (rebuilt) => { Object.assign(statsRoot, rebuilt); } };
  }
  statsRoot.fight_stats = blankFightStatsRoot();
  return { target: statsRoot.fight_stats, replace: (rebuilt) => { statsRoot.fight_stats = rebuilt; } };
};

const mutateFightEntry = async ({ source, key, action }) => {
  const file = localStatsFiles[source];
  if (!file) {
    const error = new Error('This stats source cannot be written by the local viewer.');
    error.statusCode = 400;
    throw error;
  }

  const statsRoot = JSON.parse(await readFile(file, 'utf8'));
  const { target, replace } = getMutableFightStats(statsRoot);
  target.entries = Array.isArray(target.entries) ? target.entries : [];
  const entry = target.entries.find((item) => getFightEntryKey(item) === key);

  if (!entry) {
    const error = new Error('Fight entry was not found in the stats file.');
    error.statusCode = 404;
    throw error;
  }

  const now = timestamp();
  if (action === 'exclude') {
    entry.stat_status = 'excluded';
    entry.stat_groups = [];
    entry.excluded_at = now;
  } else if (action === 'restore') {
    entry.stat_status = 'active';
    delete entry.excluded_at;
  } else if (action === 'include-youtube') {
    entry.stat_status = 'active';
    const groups = Array.isArray(entry.stat_groups) ? entry.stat_groups : [];
    entry.stat_groups = [...new Set([...groups, 'youtube'])];
    entry.youtube_at = entry.youtube_at ?? now;
  } else if (action === 'remove-youtube') {
    entry.stat_groups = (Array.isArray(entry.stat_groups) ? entry.stat_groups : []).filter((group) => group !== 'youtube');
    if (entry.video_status === 'included') delete entry.video_status;
    delete entry.youtube_at;
  } else {
    const error = new Error('Unsupported fight entry action.');
    error.statusCode = 400;
    throw error;
  }

  replace(rebuildFightStatsFromEntries(target));
  const text = `${JSON.stringify(statsRoot, null, 2)}\n`;
  await writeFile(`${file}.tmp`, text, 'utf8');
  await rename(`${file}.tmp`, file);
  return statsRoot;
};

const localStatsWriter = () => ({
  name: 'local-stats-writer',
  configureServer(server) {
    server.middlewares.use('/api/fight-entry', async (request, response) => {
      if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Use POST.' });
        return;
      }

      try {
        const body = await readRequestJson(request);
        const stats = await mutateFightEntry(body);
        sendJson(response, 200, { stats });
      } catch (error) {
        sendJson(response, error.statusCode ?? 500, { error: error.message || 'Could not update stats.' });
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), localStatsWriter()],
  server: {
    fs: {
      allow: [
        projectRoot,
        'C:/Users/Cory/Documents/coding',
      ],
    },
  },
});
