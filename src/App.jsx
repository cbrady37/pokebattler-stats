import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid2 as Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip as MuiTooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import YouTubeIcon from '@mui/icons-material/YouTube';
import SearchIcon from '@mui/icons-material/Search';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import exportedStats from '../pokemon_stats.json';
import pokemonDex from './pokemonDex.json';
import pokemonProfiles from './pokemonProfiles.json';
import pokemonTags from './pokemonTags.json';
import pokemonTypes from './pokemonTypes.json';

const typeColors = {
  normal: '#aab09f',
  fire: '#ea7a3c',
  water: '#539ae2',
  electric: '#e5c531',
  grass: '#71c558',
  ice: '#70cbd4',
  fighting: '#cb5f48',
  poison: '#b468b7',
  ground: '#cc9f4f',
  flying: '#7da6de',
  psychic: '#e5709b',
  bug: '#94bc4a',
  rock: '#b2a061',
  ghost: '#846ab6',
  dragon: '#6a7baf',
  dark: '#736c75',
  steel: '#89a1b0',
  fairy: '#e397d1',
};

const pokemonSliceColors = ['#36d8ff', '#ff2d87', '#f2c94c', '#50e36b', '#9b7bff', '#ffa94d', '#70cbd4'];

const chartTooltipProps = {
  contentStyle: {
    backgroundColor: '#f8fafc',
    border: 0,
    borderRadius: 10,
    boxShadow: '0 14px 34px rgba(0, 0, 0, 0.34)',
    color: '#070a13',
  },
  itemStyle: {
    color: '#070a13',
    fontWeight: 850,
  },
  labelStyle: {
    color: '#070a13',
    fontWeight: 850,
  },
};

const cardSurfaceSx = {
  backgroundColor: 'rgba(13, 17, 25, 0.96)',
  border: '1px solid rgba(132, 146, 166, 0.20)',
  boxShadow: '0 20px 54px rgba(0, 0, 0, 0.34)',
  position: 'relative',
  transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
};

const recapGridSx = {
  alignItems: 'stretch',
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
};

const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const pct = (part, total) => (total ? (part / total) * 100 : 0);
const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const formatInt = (value) => Math.round(number(value)).toLocaleString();
const formatOneDecimal = (value) => number(value).toFixed(1);
const formatTwoDecimals = (value) => number(value).toFixed(2);
const formatPercent = (value) => `${formatOneDecimal(value)}%`;
const formatDuration = (value) => {
  const totalSeconds = Math.max(0, number(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`;
};
const clampPercent = (value) => Math.min(100, Math.max(0, number(value)));

const views = [
  { id: 'overview', label: 'Overview' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'survival', label: 'Survival' },
  { id: 'recaps', label: 'Fight Recaps' },
];

const liveStatsSources = [
  {
    id: 'game',
    label: 'Live game stats',
    url: '/@fs/C:/Users/Cory/Documents/coding/pokemon_stats.json',
  },
  {
    id: 'video',
    label: 'Live video stats',
    url: '/@fs/C:/Users/Cory/Documents/coding/pokemon_video_stats.json',
  },
];

const fallbackStatsSource = 'Bundled repo stats';
const writableStatsSourceIds = new Set(liveStatsSources.map((source) => source.id));

const statSetLabels = {
  overall: 'Overall',
  youtube: 'YouTube',
  solo: 'Solo',
};

const spritePath = (name, icon = false) => {
  const dex = pokemonDex[name];
  if (!dex) return '';
  return `/sprite_cache/${dex}${icon ? '_icon' : ''}.png`;
};

const getPokemonTypes = (name) => {
  const types = pokemonTypes[name];
  return Array.isArray(types) && types.length ? types : ['normal'];
};

const getPokemonTags = (name) => {
  const tags = pokemonTags[name];
  return Array.isArray(tags) ? tags : [];
};

const getPokemonProfile = (name) => pokemonProfiles[name] ?? null;

const tagLabel = (tag) => tag.replace(/_/g, ' ');

function PokemonSprite({ name, size = 34, framed = true }) {
  const [fallback, setFallback] = useState(0);
  const src = fallback === 0 ? spritePath(name) : spritePath(name, true);

  if (!src || fallback > 1) {
    return (
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: framed ? '#0d1118' : 'transparent',
          border: framed ? '1px solid rgba(116, 192, 252, 0.24)' : 0,
          borderRadius: framed ? 2.5 : '50%',
          color: 'text.secondary',
          display: 'inline-flex',
          fontSize: 14,
          fontWeight: 850,
          height: size,
          justifyContent: 'center',
          minWidth: size,
          width: size,
        }}
      >
        {name.slice(0, 1)}
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt=""
      onError={() => setFallback((value) => value + 1)}
      sx={{
        bgcolor: framed ? '#0d1118' : 'transparent',
        border: framed ? '1px solid rgba(116, 192, 252, 0.24)' : 0,
        borderRadius: framed ? 2.5 : 0,
        boxShadow: framed ? 'inset 0 0 16px rgba(116, 192, 252, 0.06)' : 'none',
        filter: framed ? 'none' : 'drop-shadow(0 10px 18px rgba(0,0,0,0.5))',
        height: size,
        imageRendering: 'pixelated',
        objectFit: 'contain',
        width: size,
      }}
    />
  );
}

const normalizePokemonEntry = ([name, raw]) => {
  const battles = number(raw.battles);
  const wins = number(raw.wins);
  const kos = number(raw.kos);
  const deaths = number(raw.deaths);
  const totalDamage = number(raw.damage_dealt);
  const damageTaken = number(raw.damage_taken);
  const hits = number(raw.hits);
  const timeAliveTotal = number(raw.time_alive_total);
  const battleTimeTotal = number(raw.battle_time_total);
  const deathRankCount = number(raw.death_rank_count);
  const movePoolCount = number(raw.move_pool_count);
  const movePicks = Object.entries(raw.move_picks ?? {})
    .map(([moveName, value]) => {
      const row = typeof value === 'number' ? { count: value } : (value ?? {});
      const count = number(row.count);
      return {
        name: moveName,
        count,
        type: row.type ?? 'normal',
        pickRate: pct(count, movePoolCount),
      };
    })
    .filter((move) => move.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const safeBattles = Math.max(1, battles);

  return {
    name,
    battles,
    wins,
    kos,
    deaths,
    finishes: number(raw.finishes),
    totalDamage,
    damageTaken,
    hits,
    timeAliveTotal,
    battleTimeTotal,
    bestHit: number(raw.best_hit),
    avgDamage: totalDamage / safeBattles,
    avgDamageTaken: damageTaken / safeBattles,
    avgTimeAlive: timeAliveTotal / safeBattles,
    avgDps: totalDamage / Math.max(1, timeAliveTotal),
    avgHit: hits ? totalDamage / hits : 0,
    avgKos: kos / safeBattles,
    avgDeaths: deaths / safeBattles,
    avgDeathRank: deathRankCount ? number(raw.death_rank_total) / deathRankCount : 0,
    damageRatio: totalDamage / Math.max(1, damageTaken),
    survivalRate: pct(Math.max(0, battles - deaths), safeBattles),
    moveTypes: raw.damage_by_type ?? {},
    movePoolCount,
    movePicks,
    winRate: pct(wins, safeBattles),
  };
};

const normalizeStatsRoot = (raw = {}) => {
  const overall = Object.entries(raw.overall ?? {}).map(normalizePokemonEntry);
  const byMode = Object.fromEntries(
    Object.entries(raw.by_mode ?? {}).map(([mode, pokemon]) => [
      mode,
      Object.entries(pokemon).map(normalizePokemonEntry),
    ]),
  );
  return {
    overall,
    byMode,
    modes: Object.entries(byMode)
      .map(([mode, pokemon]) => ({
        mode,
        pokemon,
        battles: pokemon.reduce((sum, p) => sum + p.battles, 0),
        wins: pokemon.reduce((sum, p) => sum + p.wins, 0),
        damage: pokemon.reduce((sum, p) => sum + p.totalDamage, 0),
        kos: pokemon.reduce((sum, p) => sum + p.kos, 0),
      }))
      .filter((mode) => mode.battles > 0),
  };
};

const inferredTournamentRound = (roundIndex) => {
  if (roundIndex === 1) return { label: 'Heat 1', kind: 'heat', heatNumber: 1 };
  if (roundIndex === 2) return { label: 'Heat 2', kind: 'heat', heatNumber: 2 };
  if (roundIndex >= 3 && roundIndex <= 6) {
    return { label: 'Quarterfinals', kind: 'match', matchNumber: roundIndex - 2 };
  }
  if (roundIndex >= 7 && roundIndex <= 8) {
    return { label: 'Semifinals', kind: 'match', matchNumber: roundIndex - 6 };
  }
  if (roundIndex === 9) return { label: 'Final', kind: 'match', matchNumber: 1 };
  return { label: `Round ${roundIndex}`, kind: 'match', matchNumber: roundIndex };
};

const normalizeFightEntries = (entries = []) => {
  let legacyTournamentNumber = 0;
  let legacyRoundIndex = 0;
  let inLegacyTournament = false;

  return entries.map((entry) => {
    const mode = String(entry?.mode ?? '').toLowerCase();
    if (mode !== 'tournament') {
      inLegacyTournament = false;
      legacyRoundIndex = 0;
      return entry;
    }

    if (number(entry.tournament_number) > 0) {
      inLegacyTournament = false;
      legacyRoundIndex = 0;
      return entry;
    }

    if (!inLegacyTournament) {
      legacyTournamentNumber += 1;
      legacyRoundIndex = 0;
      inLegacyTournament = true;
    }

    legacyRoundIndex += 1;
    const inferred = inferredTournamentRound(legacyRoundIndex);
    return {
      ...entry,
      display_tournament_number: legacyTournamentNumber,
      display_tournament_round: entry.tournament_round ?? inferred.label,
      display_tournament_round_kind: entry.tournament_round_kind ?? inferred.kind,
      display_tournament_heat_number: entry.tournament_heat_number ?? inferred.heatNumber,
      display_tournament_match_number: entry.tournament_match_number ?? inferred.matchNumber,
    };
  });
};

const normalizeStats = (raw) => {
  if (raw?.overall && raw?.by_mode) {
    const fightStats = raw.fight_stats ?? raw;
    const curated = normalizeStatsRoot(fightStats);
    const leaderboardSets = {
      overall: curated,
      youtube: normalizeStatsRoot(fightStats.leaderboards?.youtube),
      solo: normalizeStatsRoot(fightStats.leaderboards?.solo),
    };
    return {
      ...curated,
      leaderboardSets,
      version: raw.version,
      entries: normalizeFightEntries(Array.isArray(fightStats.entries) ? fightStats.entries : []),
    };
  }

  if (Array.isArray(raw?.pokemon)) {
    const overall = raw.pokemon.map((p) => normalizePokemonEntry([p.name, {
      battles: p.battles,
      wins: p.wins,
      kos: p.kos,
      deaths: p.deaths,
      finishes: p.finishes,
      damage_dealt: p.totalDamage,
      damage_taken: p.damageTaken,
      hits: p.hits,
      best_hit: p.bestHit,
      damage_by_type: p.moveTypes,
    }]));
    const base = { overall, byMode: {}, modes: [] };
    return {
      ...base,
      leaderboardSets: { overall: base },
      version: raw.version,
      entries: normalizeFightEntries(Array.isArray(raw.entries) ? raw.entries : []),
    };
  }

  throw new Error('Expected either `overall` + `by_mode` stats or legacy `pokemon` stats.');
};

const getTournamentMeta = (entry) => {
  const tournamentNumber = number(entry.tournament_number || entry.display_tournament_number);
  const tournamentRound = entry.tournament_round ?? entry.display_tournament_round ?? '';
  const tournamentKind = entry.tournament_round_kind ?? entry.display_tournament_round_kind ?? '';
  const tournamentMatchNumber = number(entry.tournament_match_number || entry.display_tournament_match_number);
  const tournamentHeatNumber = number(entry.tournament_heat_number || entry.display_tournament_heat_number);
  const roundLabel = tournamentRound
    ? `${tournamentRound}${tournamentKind === 'match' && tournamentMatchNumber > 0 && !String(tournamentRound).includes('Match') ? ` Match ${tournamentMatchNumber}` : ''}`
    : (tournamentHeatNumber > 0 ? `Heat ${tournamentHeatNumber}` : '');

  return {
    number: tournamentNumber,
    roundLabel,
  };
};

const isExcludedFightEntry = (entry) => {
  const status = entry?.stat_status ?? entry?.video_status ?? 'active';
  return ['excluded', 'deleted', 'broken'].includes(String(status).toLowerCase());
};

const entryHasYoutubeGroup = (entry) => (
  entry?.video_status === 'included'
  || (Array.isArray(entry?.stat_groups) && entry.stat_groups.includes('youtube'))
);

const getFightEntryKey = (entry) => [
  entry?.id ?? '',
  entry?.saved_at ?? '',
  entry?.mode ?? '',
  entry?.winner ?? '',
  Array.isArray(entry?.fighters) ? entry.fighters.map((fighter) => fighter?.name).filter(Boolean).join(',') : '',
].join('|');

const fightEntryInStatSet = (entry, statSet) => {
  if (isExcludedFightEntry(entry)) return false;
  if (statSet === 'overall') return true;
  const groups = new Set(Array.isArray(entry?.stat_groups) ? entry.stat_groups : []);
  if (entryHasYoutubeGroup(entry)) groups.add('youtube');
  return groups.has(statSet);
};

const fightEntryInRecapStatSet = (entry, statSet) => (
  statSet === 'overall' || fightEntryInStatSet(entry, statSet)
);

const fightEntryInMode = (entry, mode) => (
  mode === 'overall' || String(entry?.mode ?? '').toLowerCase() === String(mode).toLowerCase()
);

const flattenMoveTypes = (pokemon) => {
  const rollup = {};
  pokemon.forEach((p) => {
    Object.entries(p.moveTypes ?? {}).forEach(([type, value]) => {
      rollup[type] = (rollup[type] ?? 0) + number(value);
    });
  });
  return Object.entries(rollup)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
};

const topBy = (rows, key) => rows.reduce((best, row) => {
  if (!best) return row;
  return number(row[key]) > number(best[key]) ? row : best;
}, null);

const baseStatRows = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'ATK' },
  { key: 'defense', label: 'DEF' },
  { key: 'sp_atk', label: 'SPA' },
  { key: 'sp_def', label: 'SPD' },
  { key: 'speed', label: 'SPE' },
];

const baseStatColor = (value) => {
  const v = number(value);
  if (v < 30) return '#c44a66';
  if (v < 60) return '#e0884e';
  if (v < 90) return '#e8b052';
  if (v < 120) return '#92cc60';
  if (v < 150) return '#60b068';
  return '#58b0d4';
};

const StatValue = ({ value, tone = 'default', suffix = '', align = 'right', fontSize = 16 }) => {
  const colors = {
    default: '#dde6f5',
    blue: '#74c0fc',
    gold: '#f2c94c',
    green: '#69db7c',
    purple: '#9b7bff',
    red: '#ff7b7b',
    pink: '#f783ac',
    orange: '#ffa94d',
    muted: '#9ca8ba',
  };
  return (
    <Box
      component="span"
      sx={{
        color: colors[tone],
        alignItems: 'center',
        alignSelf: 'stretch',
        display: 'flex',
        fontVariantNumeric: 'tabular-nums',
        fontSize,
        fontWeight: tone === 'default' || tone === 'muted' ? 750 : 850,
        height: '100%',
        justifyContent: align === 'center' ? 'center' : 'flex-end',
        lineHeight: 1.1,
        minHeight: 0,
        textAlign: align,
        width: '100%',
      }}
    >
      {value}
      {suffix && (
        <Box component="span" sx={{ color: '#9ca8ba', fontSize: Math.max(12, fontSize - 5), fontWeight: 700, ml: 0.25 }}>
          {suffix}
        </Box>
      )}
    </Box>
  );
};

const RadialStat = ({ label, value, detail, color = '#74c0fc', progress = 70, pokemon }) => (
  <Card
    sx={{
      ...cardSurfaceSx,
      '&:hover': {
        borderColor: `${color}55`,
        boxShadow: `0 26px 76px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 1px ${color}22`,
        transform: 'translateY(-1px)',
      },
      minHeight: 190,
      overflow: 'hidden',
    }}
  >
    <CardContent sx={{ alignItems: 'center', display: 'flex', gap: 2.25, height: '100%', position: 'relative', zIndex: 1 }}>
      <Box
        sx={{
          alignItems: 'center',
          background: `conic-gradient(${color} ${Math.min(100, Math.max(0, progress))}%, rgba(39, 45, 67, 0.95) 0)`,
          borderRadius: '50%',
          display: 'grid',
          height: { xs: 112, sm: 126 },
          justifyItems: 'center',
          minWidth: { xs: 112, sm: 126 },
          placeItems: 'center',
          position: 'relative',
          width: { xs: 112, sm: 126 },
          '&::before': {
            background: '#10131f',
            borderRadius: '50%',
            boxShadow: 'inset 0 0 24px rgba(0,0,0,0.48)',
            content: '""',
            height: '72%',
            position: 'absolute',
            width: '72%',
          },
        }}
      >
        {pokemon ? (
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <PokemonSprite name={pokemon.name} size={92} framed={false} />
          </Box>
        ) : (
          <Typography sx={{ color, fontSize: 34, fontWeight: 900, lineHeight: 1, position: 'relative', zIndex: 1 }}>
            {value}
          </Typography>
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography color="text.secondary" fontSize={12} fontWeight={850} textTransform="uppercase">
          {label}
        </Typography>
        <Typography sx={{ color, fontSize: { xs: 30, sm: 36 }, fontWeight: 900, lineHeight: 1, mt: 0.8 }}>
          {value}
        </Typography>
        <Typography noWrap color="text.secondary" fontSize={14} sx={{ mt: 0.8 }}>
          {detail}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const PanelCard = ({ children, sx = {}, contentSx = {} }) => (
  <Card
    sx={{
      ...cardSurfaceSx,
      overflow: 'hidden',
      ...sx,
    }}
  >
    <CardContent sx={{ position: 'relative', zIndex: 1, ...contentSx }}>
      {children}
    </CardContent>
  </Card>
);

const SectionHeader = ({ title, detail }) => (
  <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2} sx={{ mb: 1.5 }}>
    <Typography variant="h6" fontWeight={850}>{title}</Typography>
    {detail && <Typography color="text.secondary" fontSize={13}>{detail}</Typography>}
  </Stack>
);

const StatMeter = ({ label, value, detail, color = '#36d8ff', progress = 0 }) => (
  <Box>
    <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
      <Typography color="text.secondary" fontSize={12} fontWeight={850} textTransform="uppercase">
        {label}
      </Typography>
      <Typography sx={{ color, fontSize: 18, fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>
        {value}
      </Typography>
    </Stack>
    <Box
      sx={{
        bgcolor: 'rgba(45, 52, 78, 0.72)',
        borderRadius: 999,
        height: 8,
        mt: 0.8,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          bgcolor: color,
          borderRadius: 'inherit',
          boxShadow: `0 0 16px ${color}66`,
          height: '100%',
          width: `${clampPercent(progress)}%`,
        }}
      />
    </Box>
    {detail && (
      <Typography color="text.secondary" fontSize={12} sx={{ mt: 0.7 }}>
        {detail}
      </Typography>
    )}
  </Box>
);

const TypeBadge = ({ type }) => {
  const color = typeColors[type] ?? '#8ea4ff';
  return (
    <Chip
      label={String(type).toUpperCase()}
      size="small"
      sx={{
        bgcolor: `${color}22`,
        border: `1px solid ${color}88`,
        color: '#f8fafc',
        fontSize: 11,
        fontWeight: 900,
        height: 25,
        letterSpacing: 0,
      }}
    />
  );
};

const AbilityBadge = ({ ability }) => {
  const color = ability.hidden ? '#f2c94c' : '#74c0fc';
  const title = (
    <Box>
      <Typography fontSize={13} fontWeight={900}>{ability.name}</Typography>
      <Typography fontSize={12} sx={{ mt: 0.5 }}>{ability.effect}</Typography>
    </Box>
  );
  return (
    <MuiTooltip title={title} arrow placement="top">
      <Box
        component="span"
        sx={{
          bgcolor: ability.hidden ? 'rgba(96, 63, 18, 0.70)' : 'rgba(20, 27, 44, 0.86)',
          border: `1px solid ${ability.hidden ? 'rgba(242, 201, 76, 0.66)' : 'rgba(116, 192, 252, 0.34)'}`,
          borderRadius: 1,
          color: ability.hidden ? '#ffe7a3' : '#dcecff',
          cursor: 'help',
          display: 'inline-flex',
          fontSize: 12,
          fontWeight: 900,
          lineHeight: 1,
          px: 1,
          py: 0.9,
          textTransform: 'uppercase',
          boxShadow: `inset 0 1px 0 ${color}22`,
        }}
      >
        {ability.name}
      </Box>
    </MuiTooltip>
  );
};

const BaseStatsGraph = ({ stats }) => {
  const values = stats ?? {};
  const bst = number(values.bst);
  return (
    <Stack spacing={1.15}>
      {baseStatRows.map((row) => {
        const value = number(values[row.key]);
        const color = baseStatColor(value);
        return (
          <Box key={row.key}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Typography color="text.secondary" fontSize={12} fontWeight={900} sx={{ width: 34 }}>
                {row.label}
              </Typography>
              <Box
                sx={{
                  bgcolor: 'rgb(34, 40, 66)',
                  border: '1px solid rgb(66, 74, 108)',
                  borderRadius: 1,
                  flex: 1,
                  height: 12,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    bgcolor: color,
                    borderRadius: 0.8,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 0 14px ${color}44`,
                    height: '100%',
                    width: `${clampPercent((value / 255) * 100)}%`,
                  }}
                />
              </Box>
              <Typography sx={{ color, fontSize: 15, fontVariantNumeric: 'tabular-nums', fontWeight: 900, width: 42, textAlign: 'right' }}>
                {formatInt(value)}
              </Typography>
            </Stack>
          </Box>
        );
      })}
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: 'rgba(15, 19, 32, 0.82)',
          border: '1px solid rgba(132, 146, 166, 0.16)',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'space-between',
          mt: 0.4,
          px: 1.2,
          py: 1,
        }}
      >
        <Typography color="text.secondary" fontSize={12} fontWeight={900} textTransform="uppercase">
          Base Stat Total
        </Typography>
        <Typography sx={{ color: '#eef2f8', fontSize: 24, fontVariantNumeric: 'tabular-nums', fontWeight: 950, lineHeight: 1 }}>
          {bst ? formatInt(bst) : '-'}
        </Typography>
      </Box>
    </Stack>
  );
};

const ModeSplitRow = ({ row }) => {
  const survival = number(row.survivalRate);
  const damageRatio = number(row.damageRatio);
  return (
    <Box
      sx={{
        bgcolor: 'rgba(15, 19, 32, 0.82)',
        border: '1px solid rgba(58, 66, 92, 0.48)',
        borderRadius: 1,
        display: 'grid',
        gap: 1.15,
        gridTemplateColumns: { xs: '1fr', md: 'minmax(120px, 0.7fr) minmax(0, 1fr)' },
        p: 1.25,
      }}
    >
      <Stack spacing={0.8} justifyContent="center">
        <Typography fontSize={15} fontWeight={900}>{row.mode.toUpperCase()}</Typography>
        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
          <Chip
            label={`${formatPercent(row.winRate)} WR`}
            size="small"
            sx={{ bgcolor: 'rgba(242, 201, 76, 0.13)', border: '1px solid rgba(242, 201, 76, 0.34)', color: '#f6d77a', fontWeight: 900 }}
          />
          <Chip
            label={`${formatInt(row.battles)} battles`}
            size="small"
            sx={{ bgcolor: 'rgba(116, 192, 252, 0.11)', border: '1px solid rgba(116, 192, 252, 0.24)', color: '#cde7ff', fontWeight: 800 }}
          />
        </Stack>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
        }}
      >
        {[
          ['Wins', formatInt(row.wins), '#f2c94c'],
          ['KOs', formatInt(row.kos), '#ff2d87'],
          ['Survival', formatPercent(survival), '#50e36b'],
          ['Dmg Ratio', formatTwoDecimals(damageRatio), '#36d8ff'],
        ].map(([label, value, color]) => (
          <Box
            key={label}
            sx={{
              bgcolor: 'rgba(5, 7, 12, 0.38)',
              border: '1px solid rgba(132, 146, 166, 0.12)',
              borderRadius: 1,
              minHeight: 58,
              px: 1,
              py: 0.9,
            }}
          >
            <Typography color="text.secondary" fontSize={11} fontWeight={900} textTransform="uppercase">
              {label}
            </Typography>
            <Typography sx={{ color, fontSize: 20, fontVariantNumeric: 'tabular-nums', fontWeight: 950, lineHeight: 1.1, mt: 0.4 }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const MovePoolPanel = ({ moves, sampleCount }) => (
  <PanelCard sx={{ minHeight: 248 }}>
    <SectionHeader title="Move Pool" detail={sampleCount ? `${formatInt(sampleCount)} loadouts` : ''} />
    <Stack spacing={1.15}>
      {moves.length ? moves.slice(0, 4).map((move, index) => {
        const color = typeColors[move.type] ?? '#8ea4ff';
        return (
          <Box
            key={move.name}
            sx={{
              alignItems: 'center',
              bgcolor: index === 0 ? `${color}16` : 'rgba(15, 19, 32, 0.82)',
              border: `1px solid ${index === 0 ? `${color}55` : 'rgba(58, 66, 92, 0.48)'}`,
              borderRadius: 1,
              display: 'grid',
              gap: 1,
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              minHeight: 58,
              px: 1.2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap fontSize={15} fontWeight={900}>
                {move.name}
              </Typography>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.7 }}>
                <Chip
                  label={String(move.type).toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: `${color}22`,
                    border: `1px solid ${color}77`,
                    color: '#f8fafc',
                    fontSize: 10,
                    fontWeight: 900,
                    height: 21,
                  }}
                />
                <Typography color="text.secondary" fontSize={12}>
                  picked {formatInt(move.count)} times
                </Typography>
              </Stack>
            </Box>
            <Typography sx={{ color, fontSize: 24, fontVariantNumeric: 'tabular-nums', fontWeight: 950, lineHeight: 1 }}>
              {formatPercent(move.pickRate)}
            </Typography>
          </Box>
        );
      }) : (
        <Typography color="text.secondary">
          New saved fights will populate move pool pick rates for this Pokemon.
        </Typography>
      )}
    </Stack>
  </PanelCard>
);

const BattleGlyphPanel = ({ metrics }) => {
  const size = 360;
  const center = size / 2;
  const radius = 132;
  const glyphColor = '#ff2d87';
  const pointFor = (index, percent, baseRadius = radius, clamp = true) => {
    const angle = (-90 + (360 / metrics.length) * index) * (Math.PI / 180);
    const r = baseRadius * (clamp ? clampPercent(percent) : number(percent)) / 100;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  };
  const ringPoints = (scale) => metrics
    .map((_, index) => pointFor(index, 100 * scale, radius))
    .map((point) => `${point.x},${point.y}`)
    .join(' ');
  const shapePoints = metrics
    .map((metric, index) => pointFor(index, metric.score))
    .map((point) => `${point.x},${point.y}`)
    .join(' ');

  return (
    <PanelCard sx={{ height: '100%', minHeight: 360 }}>
      <SectionHeader title="Threat Profile" detail="battle pressure shape" />
      <Box
        sx={{
          alignItems: 'center',
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', md: '420px minmax(0, 1fr)' },
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            bgcolor: 'rgba(5, 7, 12, 0.34)',
            border: '1px solid rgba(132, 146, 166, 0.14)',
            borderRadius: 1,
            display: 'grid',
            justifyContent: 'center',
            minHeight: 372,
            overflow: 'hidden',
          }}
        >
          <Box component="svg" viewBox={`0 0 ${size} ${size}`} sx={{ height: 386, overflow: 'visible', width: 386 }}>
            {[0.25, 0.5, 0.75, 1].map((ring) => (
              <polygon
                key={ring}
                points={ringPoints(ring)}
                fill="none"
                stroke="rgba(132, 146, 166, 0.18)"
                strokeWidth="1"
              />
            ))}
            {metrics.map((metric, index) => {
              const outer = pointFor(index, 100);
              const label = pointFor(index, 116, radius, false);
              const node = pointFor(index, metric.score);
              return (
                <g key={metric.label}>
                  <line x1={center} y1={center} x2={outer.x} y2={outer.y} stroke={`${glyphColor}55`} strokeWidth="1.2" />
                  <circle cx={node.x} cy={node.y} r="5.5" fill={glyphColor} stroke="#07101c" strokeWidth="2" />
                  <text
                    x={label.x}
                    y={label.y}
                    fill={metric.color}
                    fontSize="13"
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {metric.short}
                  </text>
                </g>
              );
            })}
            <polygon
              points={shapePoints}
              fill="rgba(255, 45, 135, 0.15)"
              stroke={glyphColor}
              strokeLinejoin="round"
              strokeWidth="4"
            />
            <circle cx={center} cy={center} r="6" fill="#eef2f8" opacity="0.86" />
          </Box>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          }}
        >
          {metrics.map((metric) => (
            <Box
              key={metric.label}
              sx={{
                bgcolor: 'rgba(15, 19, 32, 0.82)',
                border: `1px solid ${metric.color}36`,
                borderRadius: 1,
                minHeight: 76,
                p: 1,
              }}
            >
              <Typography color="text.secondary" fontSize={11} fontWeight={900} textTransform="uppercase">
                {metric.label}
              </Typography>
              <Typography sx={{ color: metric.color, fontSize: 21, fontVariantNumeric: 'tabular-nums', fontWeight: 950, lineHeight: 1.05, mt: 0.45 }}>
                {metric.value}
              </Typography>
              <Box sx={{ bgcolor: 'rgba(45, 52, 78, 0.72)', borderRadius: 999, height: 5, mt: 0.75, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: metric.color, borderRadius: 'inherit', height: '100%', width: `${clampPercent(metric.score)}%` }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </PanelCard>
  );
};

const RankCard = ({ title, rows, color = '#36d8ff', metricLabel, getValue, getDetail, limit = 5 }) => (
  <PanelCard sx={{ minHeight: 318 }}>
    <SectionHeader title={title} detail={metricLabel} />
    <Stack spacing={1}>
      {rows.slice(0, limit).map((row, index) => (
        <Box
          key={row.name}
          sx={{
            alignItems: 'center',
            bgcolor: index === 0 ? `${color}18` : 'rgba(15, 19, 32, 0.82)',
            border: `1px solid ${index === 0 ? `${color}44` : 'rgba(58, 66, 92, 0.42)'}`,
            borderRadius: 2,
            display: 'grid',
            gap: 1,
            gridTemplateColumns: '28px 48px minmax(0, 1fr) auto',
            minHeight: 64,
            px: 1.2,
          }}
        >
          <Typography sx={{ color: index === 0 ? color : 'text.secondary', fontWeight: 900 }}>
            {index + 1}
          </Typography>
          <PokemonSprite name={row.name} size={44} />
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap fontWeight={850}>{row.name}</Typography>
            <Typography noWrap color="text.secondary" fontSize={12}>
              {getDetail ? getDetail(row) : `${row.battles.toLocaleString()} battles`}
            </Typography>
          </Box>
          <Typography sx={{ color, fontSize: 22, fontVariantNumeric: 'tabular-nums', fontWeight: 900 }}>
            {getValue(row)}
          </Typography>
        </Box>
      ))}
    </Stack>
  </PanelCard>
);

const ProfileStatCard = ({ label, value, detail, color, progress }) => (
  <PanelCard sx={{ minHeight: 132 }}>
    <Typography color="text.secondary" fontSize={12} fontWeight={850} textTransform="uppercase">
      {label}
    </Typography>
    <Typography sx={{ color, fontSize: 34, fontVariantNumeric: 'tabular-nums', fontWeight: 900, lineHeight: 1, mt: 1 }}>
      {value}
    </Typography>
    <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.8 }}>
      {detail}
    </Typography>
    <Box
      sx={{
        bgcolor: 'rgba(45, 52, 78, 0.72)',
        borderRadius: 999,
        height: 8,
        mt: 1.2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          bgcolor: color,
          borderRadius: 'inherit',
          boxShadow: `0 0 16px ${color}66`,
          height: '100%',
          width: `${clampPercent(progress)}%`,
        }}
      />
    </Box>
  </PanelCard>
);

const EmptyStateCard = ({ title, detail }) => (
  <PanelCard sx={{ minHeight: 220 }} contentSx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 220, textAlign: 'center' }}>
    <Typography fontSize={22} fontWeight={850}>{title}</Typography>
    <Typography color="text.secondary" sx={{ maxWidth: 520, mt: 1 }}>
      {detail}
    </Typography>
  </PanelCard>
);

const segmentTones = {
  cyan: {
    selected: 'rgba(54, 216, 255, 0.18)',
    border: 'rgba(54, 216, 255, 0.46)',
    glow: 'rgba(54, 216, 255, 0.16)',
  },
  green: {
    selected: 'rgba(80, 227, 107, 0.15)',
    border: 'rgba(80, 227, 107, 0.42)',
    glow: 'rgba(80, 227, 107, 0.12)',
  },
  slate: {
    selected: 'rgba(123, 97, 255, 0.18)',
    border: 'rgba(123, 97, 255, 0.42)',
    glow: 'rgba(123, 97, 255, 0.14)',
  },
};

const SegmentedControl = ({ label, value, options, onChange, tone = 'cyan' }) => {
  const colors = segmentTones[tone] ?? segmentTones.cyan;

  return (
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: 'rgba(255, 255, 255, 0.035)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 1,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        p: 0.55,
      }}
    >
      <Typography
        color="text.secondary"
        fontSize={11}
        fontWeight={900}
        letterSpacing={0}
        sx={{ px: 0.8, textTransform: 'uppercase' }}
      >
        {label}
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={value}
        onChange={(_, nextValue) => nextValue && onChange(nextValue)}
        sx={{
          flexWrap: 'wrap',
          gap: 0.45,
          '& .MuiToggleButtonGroup-grouped': {
            border: '0 !important',
            m: '0 !important',
          },
          '& .MuiToggleButton-root': {
            bgcolor: 'rgba(5, 7, 12, 0.58)',
            borderRadius: '7px !important',
            color: '#aeb8ca',
            fontSize: 14,
            fontWeight: 800,
            minHeight: 34,
            px: 1.25,
            textTransform: 'none',
          },
          '& .Mui-selected': {
            bgcolor: `${colors.selected} !important`,
            boxShadow: `inset 0 0 0 1px ${colors.border}, 0 0 18px ${colors.glow}`,
            color: '#eef2f8 !important',
          },
        }}
      >
        {options.map((item) => (
          <ToggleButton key={item.id} value={item.id}>{item.label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

const FightRecapCard = ({
  entry,
  groupedTournament = false,
  isPending = false,
  onExclude,
  onRestore,
  onIncludeYoutube,
  onRemoveYoutube,
}) => {
  const fighters = Array.isArray(entry.fighters) ? entry.fighters : [];
  const winnerNames = new Set(entry.winners ?? (entry.winner ? [entry.winner] : []));
  const winner = fighters.find((fighter) => winnerNames.has(fighter.name)) ?? fighters.find((fighter) => fighter.winner);
  const statStatus = entry.stat_status ?? entry.video_status ?? 'active';
  const isExcluded = ['excluded', 'deleted', 'broken'].includes(statStatus);
  const isTournament = String(entry.mode ?? '').toLowerCase() === 'tournament';
  const modeName = String(entry.mode ?? '').toLowerCase();
  const isRoyale = modeName.includes('royale');
  const isOneVsOne = modeName === '1v1';
  const isBoss = modeName === 'boss';
  const tournamentMeta = getTournamentMeta(entry);
  const recapLabel = isTournament
    ? (groupedTournament
      ? (tournamentMeta.roundLabel || `Fight #${entry.id}`)
      : `Tournament ${tournamentMeta.number || '?'}${tournamentMeta.roundLabel ? ` | ${tournamentMeta.roundLabel}` : ''}`)
    : `${entry.mode ?? 'battle'} #${entry.id}`;
  const statGroups = new Set(Array.isArray(entry.stat_groups) ? entry.stat_groups : []);
  if (entryHasYoutubeGroup(entry)) statGroups.add('youtube');
  const isYoutubeIncluded = statGroups.has('youtube');
  const groupLabel = [
    isExcluded ? 'Excluded' : 'Overall',
    isYoutubeIncluded ? 'YouTube' : null,
    statGroups.has('solo') ? 'Solo' : null,
  ].filter(Boolean).join(' / ');
  const mvp = fighters.reduce((best, fighter) => {
    if (!best) return fighter;
    const score = number(fighter.kos) * 1000 + number(fighter.damage_dealt) + number(fighter.best_hit);
    const bestScore = number(best.kos) * 1000 + number(best.damage_dealt) + number(best.best_hit);
    return score > bestScore ? fighter : best;
  }, null);
  const teams = Object.values(fighters.reduce((acc, fighter) => {
    const key = fighter.team ?? 0;
    acc[key] ??= { team: key, damage: 0, kos: 0, fighters: [] };
    acc[key].damage += number(fighter.damage_dealt);
    acc[key].kos += number(fighter.kos);
    acc[key].fighters.push(fighter);
    return acc;
  }, {})).sort((a, b) => a.team - b.team);
  const teamLabel = (team) => {
    if ((isRoyale || isOneVsOne || isTournament) && team.fighters.length === 1) {
      return team.fighters[0].name;
    }
    const savedTeamName = entry.team_names?.[String(team.team)] ?? entry.team_names?.[team.team];
    if (savedTeamName) {
      return savedTeamName;
    }
    if (isBoss) {
      return number(team.team) === 0 ? 'Boss' : 'Challengers';
    }
    return `Team ${number(team.team) + 1}`;
  };

  return (
    <PanelCard sx={{ height: '100%', minHeight: 290 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography color="text.secondary" fontSize={12} fontWeight={850} textTransform="uppercase">
            {recapLabel}
          </Typography>
          <Typography fontSize={24} fontWeight={900} sx={{ mt: 0.5 }}>
            {winner?.name ?? entry.winner ?? 'No winner'}
          </Typography>
          <Typography color="text.secondary" fontSize={13}>
            {entry.saved_at}{isTournament ? ` | Fight #${entry.id}` : ''}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={1}>
          <Chip
            label={groupLabel}
            size="small"
            sx={{
              bgcolor: isExcluded ? 'rgba(255, 123, 123, 0.14)' : 'rgba(80, 227, 107, 0.16)',
              border: `1px solid ${isExcluded ? 'rgba(255, 123, 123, 0.38)' : 'rgba(80, 227, 107, 0.38)'}`,
              color: isExcluded ? '#ff7b7b' : '#69db7c',
              fontWeight: 850,
            }}
          />
          {!isExcluded && (
            <Button
              size="small"
              variant="outlined"
              startIcon={isYoutubeIncluded ? <RestoreIcon /> : <YouTubeIcon />}
              disabled={isPending}
              onClick={() => (
                isYoutubeIncluded
                  ? onRemoveYoutube?.(entry)
                  : onIncludeYoutube?.(entry)
              )}
              sx={{
                borderColor: isYoutubeIncluded ? 'rgba(255, 123, 123, 0.44)' : 'rgba(255, 123, 123, 0.34)',
                color: isYoutubeIncluded ? '#ff7b7b' : '#ff9b9b',
                fontWeight: 850,
                textTransform: 'none',
              }}
            >
              {isYoutubeIncluded ? 'Remove YT' : 'Include YT'}
            </Button>
          )}
          {isExcluded ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestoreIcon />}
              disabled={isPending}
              onClick={() => onRestore?.(entry)}
              sx={{
                borderColor: 'rgba(80, 227, 107, 0.42)',
                color: '#69db7c',
                fontWeight: 850,
                textTransform: 'none',
              }}
            >
              Restore
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<BlockIcon />}
              disabled={isPending}
              onClick={() => onExclude?.(entry)}
              sx={{
                borderColor: 'rgba(255, 123, 123, 0.38)',
                color: isExcluded ? 'rgba(255, 123, 123, 0.48)' : '#ff7b7b',
                fontWeight: 850,
                textTransform: 'none',
              }}
            >
              Exclude
            </Button>
          )}
          {winner && <PokemonSprite name={winner.name} size={72} />}
        </Stack>
      </Stack>
      <Grid container spacing={1.2} sx={{ mt: 1.5 }}>
        {teams.map((team) => (
          <Grid key={team.team} size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                bgcolor: team.fighters.some((fighter) => winnerNames.has(fighter.name)) ? 'rgba(54, 216, 255, 0.12)' : 'rgba(255, 45, 135, 0.10)',
                border: '1px solid rgba(116, 192, 252, 0.16)',
                borderRadius: 2,
                p: 1.2,
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography fontWeight={850}>
                  {teamLabel(team)}
                </Typography>
                <Typography color="text.secondary" fontSize={13}>
                  {formatInt(team.damage)} dmg | {team.kos} KOs
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.8} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
                {team.fighters.map((fighter) => (
                  <Box key={fighter.name} sx={{ opacity: fighter.alive ? 1 : 0.52 }}>
                    <PokemonSprite name={fighter.name} size={36} />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
      {mvp && (
        <Box sx={{ borderTop: '1px solid rgba(58, 66, 92, 0.5)', mt: 1.5, pt: 1.4 }}>
          <Typography color="text.secondary" fontSize={12} fontWeight={850} textTransform="uppercase">MVP</Typography>
          <Typography fontWeight={850}>{mvp.name} | {mvp.kos} KOs | {formatInt(mvp.damage_dealt)} damage | {formatInt(mvp.best_hit)} best hit</Typography>
        </Box>
      )}
    </PanelCard>
  );
};

const TournamentRecapGroup = ({
  group,
  pendingFightActions,
  onExclude,
  onRestore,
  onIncludeYoutube,
  onRemoveYoutube,
}) => {
  const rounds = group.entries.map((entry) => getTournamentMeta(entry).roundLabel || `Fight #${entry.id}`);
  const finalEntry = [...group.entries].reverse().find((entry) => String(getTournamentMeta(entry).roundLabel).startsWith('Final'));
  const latestEntry = group.entries[group.entries.length - 1];
  const headlineEntry = finalEntry ?? latestEntry;
  const headlineNames = headlineEntry?.winners ?? (headlineEntry?.winner ? [headlineEntry.winner] : []);
  const headline = headlineNames[0] ?? 'Pending';

  return (
    <Box
      sx={{
        bgcolor: 'rgba(7, 10, 19, 0.42)',
        border: '1px solid rgba(132, 146, 166, 0.20)',
        borderRadius: 1,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        gridColumn: '1 / -1',
        mt: 0.75,
        p: { xs: 1.25, md: 1.6 },
        width: '100%',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={1}
        sx={{
          bgcolor: 'rgba(13, 17, 25, 0.72)',
          border: '1px solid rgba(242, 201, 76, 0.16)',
          borderRadius: 1,
          mb: 1.5,
          px: 1.25,
          py: 1,
        }}
      >
        <Box>
          <Typography fontSize={22} fontWeight={950}>
            Tournament {group.number || '?'}
          </Typography>
          <Typography color="text.secondary" fontSize={13}>
            {group.entries.length} fights | {rounds.filter(Boolean).join(' -> ')}
          </Typography>
        </Box>
        <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={0.7}>
          <Chip
            label={`${finalEntry ? 'Champion' : 'Latest winner'}: ${headline}`}
            size="small"
            sx={{
              bgcolor: 'rgba(242, 201, 76, 0.14)',
              border: '1px solid rgba(242, 201, 76, 0.34)',
              color: '#f2c94c',
              fontWeight: 900,
            }}
          />
          <Typography color="text.secondary" fontSize={12}>
            {group.entries[0]?.saved_at} - {group.entries[group.entries.length - 1]?.saved_at}
          </Typography>
        </Stack>
      </Stack>
      <Box sx={recapGridSx}>
        {group.entries.map((entry) => (
          <Box key={entry.id} sx={{ minWidth: 0 }}>
            <FightRecapCard
              entry={entry}
              groupedTournament
              isPending={pendingFightActions.has(getFightEntryKey(entry))}
              onExclude={onExclude}
              onRestore={onRestore}
              onIncludeYoutube={onIncludeYoutube}
              onRemoveYoutube={onRemoveYoutube}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

function App() {
  const [stats, setStats] = useState(exportedStats);
  const [statsSource, setStatsSource] = useState(fallbackStatsSource);
  const [statsSourceId, setStatsSourceId] = useState('bundled');
  const [statsLoadedAt, setStatsLoadedAt] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('overview');
  const [statSet, setStatSet] = useState('overall');
  const [mode, setMode] = useState('overall');
  const [search, setSearch] = useState('');
  const [minBattles, setMinBattles] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState('');
  const [activeDamageType, setActiveDamageType] = useState('');
  const [pendingFightActions, setPendingFightActions] = useState(() => new Set());
  const clearActiveDamageType = () => setActiveDamageType('');
  const liveStatsTextRef = useRef('');
  const normalizedStats = useMemo(() => normalizeStats(stats), [stats]);
  const availableStatSets = useMemo(
    () => Object.entries(normalizedStats.leaderboardSets ?? { overall: normalizedStats })
      .filter(([, value]) => value.overall.length || value.modes.length || normalizedStats.entries.length)
      .map(([id]) => id),
    [normalizedStats],
  );
  const activeStats = normalizedStats.leaderboardSets?.[statSet] ?? normalizedStats.leaderboardSets?.overall ?? normalizedStats;

  const availableModes = useMemo(
    () => ['overall', ...activeStats.modes.map((item) => item.mode)],
    [activeStats],
  );

  useEffect(() => {
    if (!autoRefresh) return undefined;

    let cancelled = false;

    const loadLiveStats = async () => {
      for (const source of liveStatsSources) {
        try {
          const response = await fetch(`${source.url}?t=${Date.now()}`, { cache: 'no-store' });
          if (!response.ok) continue;
          const text = await response.text();
          if (!text.trim() || text === liveStatsTextRef.current) return;

          const parsed = JSON.parse(text);
          normalizeStats(parsed);
          if (cancelled) return;

          liveStatsTextRef.current = text;
          setStats(parsed);
          setStatsSource(source.label);
          setStatsSourceId(source.id);
          setStatsLoadedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
          setError('');
          return;
        } catch {
          // Try the next configured local stats file before falling back.
        }
      }

      if (!cancelled && !liveStatsTextRef.current) {
        setStatsSource(fallbackStatsSource);
        setStatsSourceId('bundled');
      }
    };

    loadLiveStats();
    const intervalId = window.setInterval(loadLiveStats, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (availableStatSets.length && !availableStatSets.includes(statSet)) {
      setStatSet(availableStatSets[0]);
      setMode('overall');
      setSelectedPokemon('');
    }
  }, [availableStatSets, statSet]);

  useEffect(() => {
    if (!availableModes.includes(mode)) {
      setMode('overall');
    }
  }, [availableModes, mode]);

  const persistFightEntryAction = async (entry, action) => {
    const key = getFightEntryKey(entry);
    const pendingKey = key;

    if (!writableStatsSourceIds.has(statsSourceId)) {
      setError('Use live local stats before changing a fight. Uploaded and bundled stats cannot be rewritten from the viewer.');
      return;
    }

    setPendingFightActions((current) => {
      const next = new Set(current);
      next.add(pendingKey);
      return next;
    });

    try {
      const response = await fetch('/api/fight-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: statsSourceId, key, action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Could not update the stats file.');
      }

      normalizeStats(payload.stats);
      liveStatsTextRef.current = '';
      setStats(payload.stats);
      setStatsLoadedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
      setError('');
    } catch (actionError) {
      setError(`Could not update stats file: ${actionError.message}`);
    } finally {
      setPendingFightActions((current) => {
        const next = new Set(current);
        next.delete(pendingKey);
        return next;
      });
    }
  };

  const excludeFightFromViewer = (entry) => persistFightEntryAction(entry, 'exclude');
  const restoreFightToViewer = (entry) => persistFightEntryAction(entry, 'restore');
  const includeFightInYoutube = (entry) => persistFightEntryAction(entry, 'include-youtube');
  const removeFightFromYoutube = (entry) => persistFightEntryAction(entry, 'remove-youtube');

  const activePokemon = mode === 'overall'
    ? activeStats.overall
    : activeStats.byMode[mode] ?? [];

  const availableTags = useMemo(() => {
    const priority = ['stage1', 'stage2', 'stage3', 'starter', 'solo', 'legendary', 'mythical', 'pseudo_legendary', 'fossil', 'fan_favorite', 'eevee_line'];
    const tags = new Set();
    activePokemon.forEach((p) => getPokemonTags(p.name).forEach((tag) => tags.add(tag)));
    return [...tags].sort((a, b) => {
      const pa = priority.indexOf(a);
      const pb = priority.indexOf(b);
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      return a.localeCompare(b);
    });
  }, [activePokemon]);

  const toggleTag = (tag) => {
    setSelectedTags((current) => (
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    ));
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activePokemon
      .filter((p) => p.battles >= minBattles)
      .filter((p) => !query || p.name.toLowerCase().includes(query))
      .filter((p) => selectedTags.every((tag) => getPokemonTags(p.name).includes(tag)))
      .sort((a, b) => b.wins - a.wins || b.kos - a.kos || b.battles - a.battles || a.name.localeCompare(b.name))
      .map((p, idx) => ({ ...p, id: p.name, rank: idx + 1 }));
  }, [activePokemon, minBattles, search, selectedTags]);
  const scopedFightEntries = useMemo(
    () => normalizedStats.entries.filter((entry) => fightEntryInStatSet(entry, statSet) && fightEntryInMode(entry, mode)),
    [mode, normalizedStats.entries, statSet],
  );
  const filteredFightCount = useMemo(() => {
    if (!scopedFightEntries.length || !filteredRows.length) return 0;
    const names = new Set(filteredRows.map((row) => row.name));
    return scopedFightEntries.filter((entry) => {
      const fighters = Array.isArray(entry.fighters) ? entry.fighters : [];
      return fighters.some((fighter) => names.has(fighter.name));
    }).length;
  }, [filteredRows, scopedFightEntries]);

  const profileRows = useMemo(
    () => [...activePokemon]
      .sort((a, b) => b.wins - a.wins || b.totalDamage - a.totalDamage || a.name.localeCompare(b.name)),
    [activePokemon],
  );
  const selectedProfileName = profileRows.some((p) => p.name === selectedPokemon)
    ? selectedPokemon
    : profileRows[0]?.name ?? '';
  const selectedProfile = profileRows.find((p) => p.name === selectedProfileName) ?? null;
  const selectedProfileModes = selectedProfile
    ? activeStats.modes
      .map(({ mode: modeName }) => {
        const row = activeStats.byMode[modeName]?.find((p) => p.name === selectedProfile.name);
        return row ? { ...row, mode: modeName } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.battles - a.battles)
    : [];
  const selectedProfileMeta = selectedProfile ? getPokemonProfile(selectedProfile.name) : null;
  const selectedProfileTypes = selectedProfileMeta?.types?.length
    ? selectedProfileMeta.types
    : (selectedProfile ? getPokemonTypes(selectedProfile.name) : []);
  const selectedProfileAbilities = selectedProfileMeta?.abilities ?? [];
  const selectedProfileStats = selectedProfileMeta?.base_stats ?? null;

  const kpis = useMemo(() => {
    const totalAppearances = filteredRows.reduce((sum, p) => sum + p.battles, 0);
    const wins = filteredRows.reduce((sum, p) => sum + p.wins, 0);
    const totalKos = filteredRows.reduce((sum, p) => sum + p.kos, 0);
    const totalDamage = filteredRows.reduce((sum, p) => sum + p.totalDamage, 0);
    const topDamage = topBy(filteredRows, 'totalDamage');
    return {
      pokemonCount: filteredRows.length,
      fightCount: filteredFightCount,
      totalAppearances,
      totalDamage,
      totalKos,
      winRate: pct(wins, totalAppearances),
      mostWins: topBy(filteredRows, 'wins'),
      mostKos: topBy(filteredRows, 'kos'),
      topDamage,
      avgKos: avg(filteredRows.map((p) => p.avgKos)),
      avgDeaths: avg(filteredRows.map((p) => p.avgDeaths)),
    };
  }, [filteredFightCount, filteredRows]);

  const damageByPokemon = filteredRows
    .filter((p) => p.totalDamage > 0)
    .sort((a, b) => b.totalDamage - a.totalDamage)
    .slice(0, 14)
    .map((p) => ({ name: p.name, damage: p.totalDamage, types: getPokemonTypes(p.name) }));
  const typeDamage = flattenMoveTypes(filteredRows).slice(0, 12);
  const typeDamageTotal = typeDamage.reduce((sum, type) => sum + type.value, 0);
  const typeDamageBreakdown = typeDamage.map((type) => ({
    ...type,
    share: pct(type.value, typeDamageTotal),
  }));
  const selectedTypeName = typeDamage.some((type) => type.name === activeDamageType) ? activeDamageType : '';
  const selectedTypeTotal = typeDamage.find((type) => type.name === selectedTypeName)?.value ?? 0;
  const activeTypeIndex = typeDamage.findIndex((type) => type.name === selectedTypeName);
  const typeDamagePokemon = useMemo(() => {
    if (!selectedTypeName) return [];
    return filteredRows
      .map((pokemon) => ({
        name: pokemon.name,
        value: number(pokemon.moveTypes?.[selectedTypeName]),
      }))
      .filter((pokemon) => pokemon.value > 0)
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
      .slice(0, 7)
      .map((pokemon) => ({
        ...pokemon,
        share: pct(pokemon.value, selectedTypeTotal),
        types: getPokemonTypes(pokemon.name),
      }));
  }, [filteredRows, selectedTypeName, selectedTypeTotal]);
  const typeDamagePokemonSlices = useMemo(() => {
    const visibleTotal = typeDamagePokemon.reduce((sum, pokemon) => sum + pokemon.value, 0);
    const otherValue = Math.max(0, selectedTypeTotal - visibleTotal);
    return [
      ...typeDamagePokemon.map((pokemon, index) => ({
        ...pokemon,
        color: pokemonSliceColors[index % pokemonSliceColors.length],
      })),
      ...(otherValue > 0 ? [{
        name: 'Other',
        value: otherValue,
        share: pct(otherValue, selectedTypeTotal),
        types: [selectedTypeName],
        color: 'rgba(132, 146, 166, 0.72)',
        isOther: true,
      }] : []),
    ];
  }, [selectedTypeName, selectedTypeTotal, typeDamagePokemon]);
  const renderSplitTypeSlice = ({
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
  }) => {
    const midAngle = (startAngle + endAngle) / 2;
    const offsetX = Math.cos(-midAngle * Math.PI / 180) * 12;
    const offsetY = Math.sin(-midAngle * Math.PI / 180) * 12;
    const total = Math.max(1, typeDamagePokemonSlices.reduce((sum, pokemon) => sum + pokemon.value, 0));
    const angleSpan = endAngle - startAngle;
    let cursor = startAngle;

    return (
      <g
        transform={`translate(${offsetX}, ${offsetY})`}
        style={{ transition: 'transform 180ms ease-out' }}
      >
        {typeDamagePokemonSlices.map((pokemon, index) => {
          const nextAngle = index === typeDamagePokemonSlices.length - 1
            ? endAngle
            : cursor + angleSpan * (pokemon.value / total);
          const sector = (
            <Sector
              key={`${pokemon.name}-${index}`}
              cx={cx}
              cy={cy}
              innerRadius={innerRadius}
              outerRadius={outerRadius + 14}
              startAngle={cursor}
              endAngle={nextAngle}
              fill={pokemon.color}
              stroke="rgba(7,10,16,0.92)"
              strokeWidth={2}
              cornerRadius={3}
              style={{ filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.24))', transition: 'opacity 160ms ease, fill 160ms ease' }}
            />
          );
          cursor = nextAngle;
          return sector;
        })}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 14}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="transparent"
          stroke="rgba(248,250,252,0.86)"
          strokeWidth={2}
          cornerRadius={3}
        />
      </g>
    );
  };
  const profileTypeDamage = selectedProfile ? flattenMoveTypes([selectedProfile]).slice(0, 7) : [];
  const profileMovePicks = selectedProfile?.movePicks ?? [];
  const maxStats = useMemo(() => ({
    avgDamage: Math.max(1, ...profileRows.map((p) => p.avgDamage)),
    avgKos: Math.max(1, ...profileRows.map((p) => p.avgKos)),
    avgDps: Math.max(1, ...profileRows.map((p) => p.avgDps)),
    totalDamage: Math.max(1, ...profileRows.map((p) => p.totalDamage)),
    bestHit: Math.max(1, ...profileRows.map((p) => p.bestHit)),
    damageRatio: Math.max(1, ...profileRows.map((p) => p.damageRatio)),
  }), [profileRows]);
  const profileGlyphMetrics = selectedProfile ? [
    { label: 'KO Rate', short: 'KO', value: formatTwoDecimals(selectedProfile.avgKos), score: (selectedProfile.avgKos / maxStats.avgKos) * 100, color: '#ff2d87' },
    { label: 'Finish Rate', short: 'FIN', value: formatPercent(pct(selectedProfile.finishes, selectedProfile.battles)), score: pct(selectedProfile.finishes, selectedProfile.battles), color: '#f2c94c' },
    { label: 'Avg Dmg', short: 'DMG', value: formatOneDecimal(selectedProfile.avgDamage), score: (selectedProfile.avgDamage / maxStats.avgDamage) * 100, color: '#9b7bff' },
    { label: 'DPS', short: 'DPS', value: formatTwoDecimals(selectedProfile.avgDps), score: (selectedProfile.avgDps / maxStats.avgDps) * 100, color: '#36d8ff' },
    { label: 'Dmg Ratio', short: 'RTO', value: formatTwoDecimals(selectedProfile.damageRatio), score: (selectedProfile.damageRatio / maxStats.damageRatio) * 100, color: '#50e36b' },
    { label: 'Best Hit', short: 'HIT', value: selectedProfile.bestHit ? formatInt(selectedProfile.bestHit) : '-', score: (selectedProfile.bestHit / maxStats.bestHit) * 100, color: '#ffa94d' },
  ] : [];
  const topWinsRows = [...filteredRows].sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  const topDamageRows = [...filteredRows].sort((a, b) => b.totalDamage - a.totalDamage);
  const topBestHitRows = [...filteredRows].sort((a, b) => b.bestHit - a.bestHit);
  const survivalLeaders = [...filteredRows].sort((a, b) => b.survivalRate - a.survivalRate || b.wins - a.wins);
  const survivalExpertRows = [...filteredRows]
    .filter((p) => p.avgTimeAlive > 0)
    .sort((a, b) => b.avgTimeAlive - a.avgTimeAlive || b.survivalRate - a.survivalRate);
  const consistentPerformerRows = [...filteredRows]
    .filter((p) => p.avgDps > 0)
    .sort((a, b) => b.avgDps - a.avgDps || b.avgDamage - a.avgDamage);
  const pressureRows = [...filteredRows].sort((a, b) => b.avgKos - a.avgKos || b.totalDamage - a.totalDamage);
  const threatBaseRows = [...filteredRows]
    .filter((p) => p.battles > 0 && (p.survivalRate > 0 || p.avgTimeAlive > 0 || p.avgDps > 0 || p.avgKos > 0))
    .slice(0, 80);
  const threatMaxTime = Math.max(1, ...threatBaseRows.map((p) => p.avgTimeAlive));
  const threatMaxDps = Math.max(1, ...threatBaseRows.map((p) => p.avgDps));
  const threatMaxKos = Math.max(1, ...threatBaseRows.map((p) => p.avgKos));
  const threatTierRows = threatBaseRows
    .map((p) => {
      const timeNorm = p.avgTimeAlive / threatMaxTime;
      const dpsNorm = p.avgDps / threatMaxDps;
      const kosNorm = p.avgKos / threatMaxKos;
      const survivalNorm = p.survivalRate / 100;
      const score = survivalNorm * 36 + timeNorm * 24 + dpsNorm * 23 + kosNorm * 17;
      return {
        ...p,
        primaryType: getPokemonTypes(p.name)[0] ?? 'normal',
        threatScore: score,
        threatMeter: clampPercent(score),
        role: dpsNorm >= 0.7 ? 'Burst' : kosNorm >= 0.65 ? 'Closer' : survivalNorm >= 0.7 ? 'Anchor' : timeNorm >= 0.65 ? 'Stayer' : 'Threat',
      };
    })
    .sort((a, b) => (
      b.threatScore - a.threatScore || b.wins - a.wins || b.totalDamage - a.totalDamage
    ))
    .slice(0, 18)
    .map((p, index) => ({ ...p, threatRank: index + 1 }));
  const threatTierBands = [
    { id: 's', label: 'S', title: 'Endgame Threats', rows: threatTierRows.slice(0, 4), color: '#f2c94c' },
    { id: 'a', label: 'A', title: 'Reliable Carries', rows: threatTierRows.slice(4, 9), color: '#50e36b' },
    { id: 'b', label: 'B', title: 'Danger Picks', rows: threatTierRows.slice(9, 14), color: '#36d8ff' },
    { id: 'c', label: 'C', title: 'Swing Fighters', rows: threatTierRows.slice(14, 18), color: '#ff2d87' },
  ].filter((tier) => tier.rows.length);
  const recapEntries = useMemo(
    () => [...normalizedStats.entries]
      .filter((entry) => fightEntryInRecapStatSet(entry, statSet))
      .filter((entry) => mode === 'overall' || String(entry.mode ?? '').toLowerCase() === String(mode).toLowerCase()),
    [mode, normalizedStats.entries, statSet],
  );
  const recapGroups = useMemo(() => {
    const groupMap = new Map();
    const groups = [];

    recapEntries.forEach((entry) => {
      const isTournament = String(entry.mode ?? '').toLowerCase() === 'tournament';
      if (!isTournament) {
        groups.push({ type: 'entry', id: `entry-${entry.id}`, entry, lastId: number(entry.id) });
        return;
      }

      const meta = getTournamentMeta(entry);
      const key = `tournament-${meta.number || entry.display_tournament_number || entry.id}`;
      if (!groupMap.has(key)) {
        const group = { type: 'tournament', id: key, number: meta.number, entries: [], lastId: 0 };
        groupMap.set(key, group);
        groups.push(group);
      }
      const group = groupMap.get(key);
      group.entries.push(entry);
      group.lastId = Math.max(group.lastId, number(entry.id));
    });

    return groups
      .filter((group) => group.type !== 'tournament' || group.entries.length > 0)
      .sort((a, b) => b.lastId - a.lastId)
      .slice(0, 10)
      .map((group) => (
        group.type === 'tournament'
          ? { ...group, entries: [...group.entries].sort((a, b) => number(a.id) - number(b.id)) }
          : group
      ));
  }, [recapEntries]);

  const uploadJson = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      normalizeStats(parsed);
      liveStatsTextRef.current = text;
      setStats(parsed);
      setStatsSource(`Uploaded ${file.name}`);
      setStatsSourceId('uploaded');
      setStatsLoadedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
      setAutoRefresh(false);
      setStatSet('overall');
      setMode('overall');
      setSelectedTags([]);
      setSelectedPokemon('');
      setError('');
    } catch (e) {
      setError(`Could not parse stats file: ${e.message}`);
    }
  };

  const metricCards = [
    {
      label: 'Pokemon',
      value: kpis.pokemonCount,
      detail: kpis.fightCount
        ? `${formatInt(kpis.fightCount)} saved fights / ${formatInt(kpis.totalAppearances)} appearances`
        : `${formatInt(kpis.totalAppearances)} appearances`,
      color: '#36d8ff',
      progress: Math.min(100, (kpis.pokemonCount / Math.max(1, activeStats.overall.length)) * 100),
    },
    { label: 'Most Wins', value: kpis.mostWins?.wins ?? 0, detail: kpis.mostWins?.name ?? '-', color: '#f2c94c', pokemon: kpis.mostWins, progress: pct(kpis.mostWins?.wins ?? 0, Math.max(1, kpis.mostWins?.battles ?? 0)) },
    { label: 'Most KOs', value: kpis.mostKos?.kos ?? 0, detail: kpis.mostKos?.name ?? '-', color: '#ff2d87', pokemon: kpis.mostKos, progress: pct(kpis.mostKos?.kos ?? 0, Math.max(1, kpis.totalKos)) },
    { label: 'Top Damage', value: formatInt(kpis.topDamage?.totalDamage ?? 0), detail: kpis.topDamage?.name ?? '-', color: '#7b61ff', pokemon: kpis.topDamage, progress: pct(kpis.topDamage?.totalDamage ?? 0, Math.max(1, kpis.totalDamage)) },
  ];

  const columns = [
    {
      field: 'name',
      headerName: 'Pokemon',
      minWidth: 285,
      flex: 1,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, width: '100%' }}>
          <Typography sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', fontWeight: 800, width: 30 }}>
            {row.rank}
          </Typography>
          <PokemonSprite name={row.name} size={58} />
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap fontSize={15} fontWeight={850} lineHeight={1.1}>{row.name}</Typography>
            <Typography color="text.secondary" fontSize={12} lineHeight={1.2}>
              {row.battles.toLocaleString()} battles
            </Typography>
          </Box>
        </Stack>
      ),
    },
    { field: 'battles', headerName: 'Battles', width: 96, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="blue" value={formatInt(value)} /> },
    { field: 'wins', headerName: 'Wins', width: 86, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="gold" value={formatInt(value)} /> },
    { field: 'winRate', headerName: 'Win %', width: 96, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone={value >= 50 ? 'gold' : 'muted'} value={formatOneDecimal(value)} suffix="%" /> },
    { field: 'kos', headerName: 'KOs', width: 82, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="pink" value={formatInt(value)} /> },
    { field: 'avgKos', headerName: 'KOs/B', width: 92, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="pink" value={formatTwoDecimals(value)} /> },
    { field: 'totalDamage', headerName: 'Damage', width: 116, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="purple" value={formatInt(value)} /> },
    { field: 'avgDamage', headerName: 'Avg Dmg', width: 106, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="purple" value={formatOneDecimal(value)} /> },
    { field: 'avgDps', headerName: 'DPS', width: 88, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="blue" value={formatTwoDecimals(value)} /> },
    { field: 'damageRatio', headerName: 'Ratio', width: 92, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone={value >= 1 ? 'green' : 'muted'} value={formatTwoDecimals(value)} /> },
    { field: 'hits', headerName: 'Hits', width: 78, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} value={formatInt(value)} /> },
    { field: 'bestHit', headerName: 'Best Hit', width: 98, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="orange" value={value ? formatInt(value) : '-'} /> },
    { field: 'finishes', headerName: 'Finishes', width: 96, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="orange" value={formatInt(value)} /> },
    { field: 'deaths', headerName: 'Deaths', width: 88, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="red" value={formatInt(value)} /> },
    { field: 'survivalRate', headerName: 'Survival', width: 104, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone={value >= 50 ? 'green' : 'muted'} value={formatOneDecimal(value)} suffix="%" /> },
  ];

  const filterControls = (
    <>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <TextField
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Pokemon"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3, lg: 2 }}>
          <TextField
            fullWidth
            select
            label="Min battles"
            value={minBattles}
            onChange={(event) => setMinBattles(Number(event.target.value))}
          >
            {[0, 1, 3, 5, 10, 20, 40].map((value) => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 3, lg: 7 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}>
            {activeStats.modes.map((item) => (
              <Chip
                key={item.mode}
                label={`${item.mode}: ${item.battles.toLocaleString()} battles | ${formatInt(item.damage)} dmg | ${formatPercent(pct(item.wins, item.battles))}`}
                sx={{
                  bgcolor: 'rgba(17, 21, 36, 0.92)',
                  border: '1px solid rgba(123, 97, 255, 0.28)',
                  color: '#dde6f5',
                  height: 38,
                }}
              />
            ))}
          </Stack>
        </Grid>
      </Grid>
      <Box
        sx={{
          bgcolor: 'rgba(10, 13, 23, 0.72)',
          border: '1px solid rgba(123, 97, 255, 0.22)',
          borderRadius: 2,
          px: 1.4,
          py: 1.2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
          <Typography color="text.secondary" fontSize={12} fontWeight={850} textTransform="uppercase">
            Tags
          </Typography>
          {availableTags.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <Chip
                key={tag}
                label={tagLabel(tag)}
                onClick={() => toggleTag(tag)}
                sx={{
                  bgcolor: selected ? 'rgba(54, 216, 255, 0.18)' : 'rgba(17, 21, 36, 0.92)',
                  border: `1px solid ${selected ? 'rgba(54, 216, 255, 0.58)' : 'rgba(58, 66, 92, 0.55)'}`,
                  color: selected ? '#eef2f8' : '#aeb8ca',
                  cursor: 'pointer',
                  height: 32,
                  textTransform: 'capitalize',
                }}
              />
            );
          })}
          {selectedTags.length > 0 && (
            <Chip
              label={`Clear ${selectedTags.length}`}
              onClick={() => setSelectedTags([])}
              sx={{
                bgcolor: 'rgba(255, 45, 135, 0.14)',
                border: '1px solid rgba(255, 45, 135, 0.38)',
                color: '#f783ac',
                cursor: 'pointer',
                height: 32,
              }}
            />
          )}
        </Stack>
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        overflowX: 'hidden',
        position: 'relative',
        backgroundColor: '#070a10',
        '&::before': {
          backgroundColor: 'rgba(19, 85, 95, 0.18)',
          clipPath: 'polygon(63% 0, 100% 0, 100% 38%, 78% 54%, 54% 31%)',
          content: '""',
          inset: 0,
          pointerEvents: 'none',
          position: 'fixed',
          zIndex: 0,
        },
        '&::after': {
          backgroundColor: 'rgba(117, 45, 83, 0.16)',
          clipPath: 'polygon(0 58%, 19% 47%, 42% 66%, 32% 100%, 0 100%)',
          content: '""',
          inset: 0,
          pointerEvents: 'none',
          position: 'fixed',
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1460, position: 'relative', py: { xs: 2.5, md: 3.5 }, zIndex: 1 }}>
        <Stack spacing={2.2}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={2}>
            <Box>
              <Typography
                component="h1"
                fontWeight={850}
                lineHeight={1}
                sx={{ fontSize: 'clamp(32px, 5vw, 42px)' }}
              >
                Pokemon Battle Stats
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ alignSelf: { xs: 'flex-start', md: 'auto' } }}>
              <Button
                variant="outlined"
                disabled={autoRefresh}
                onClick={() => {
                  liveStatsTextRef.current = '';
                  setAutoRefresh(true);
                }}
                sx={{ textTransform: 'none' }}
              >
                Use live local
              </Button>
              <Button component="label" variant="contained" startIcon={<UploadFileIcon />} sx={{ textTransform: 'none' }}>
                Upload stats JSON
                <input hidden type="file" accept="application/json" onChange={uploadJson} />
              </Button>
            </Stack>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              alignItems: 'center',
              backgroundColor: 'rgba(13, 17, 25, 0.94)',
              border: '1px solid rgba(132, 146, 166, 0.18)',
              borderRadius: 1,
              boxShadow: '0 18px 46px rgba(0, 0, 0, 0.28)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              p: { xs: 1, sm: 1.15 },
            }}
          >
            <SegmentedControl
              label="View"
              value={view}
              options={views}
              onChange={setView}
              tone="cyan"
            />
            {availableStatSets.length > 1 && (
              <SegmentedControl
                label="Dataset"
                value={statSet}
                options={availableStatSets.map((item) => ({ id: item, label: statSetLabels[item] ?? item }))}
                onChange={(nextValue) => {
                  setStatSet(nextValue);
                  setMode('overall');
                  setSelectedPokemon('');
                }}
                tone="green"
              />
            )}
            <SegmentedControl
              label={view === 'recaps' ? 'Recaps' : 'Mode'}
              value={mode}
              options={availableModes.map((item) => ({ id: item, label: item === 'overall' ? 'Overall' : item.toUpperCase() }))}
              onChange={setMode}
              tone="slate"
            />
          </Box>

          {view === 'overview' && (
            <Grid container spacing={1.75}>
              {metricCards.map((card) => (
                <Grid key={card.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                  <RadialStat {...card} />
                </Grid>
              ))}
            </Grid>
          )}

          {view === 'overview' && (
            <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ ...cardSurfaceSx, height: 390 }}>
                <CardContent sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
                  <Typography variant="h6" fontWeight={850} gutterBottom>Top Damage</Typography>
                  <ResponsiveContainer width="100%" height="88%">
                    <BarChart data={damageByPokemon} layout="vertical" margin={{ left: 22, right: 24, top: 8, bottom: 8 }}>
                      <CartesianGrid stroke="rgba(74,85,111,0.42)" horizontal={false} />
                      <XAxis type="number" stroke="#9ca8ba" />
                      <YAxis dataKey="name" type="category" width={116} stroke="#c8d2e4" tickLine={false} axisLine={false} interval={0} />
                      <Tooltip {...chartTooltipProps} cursor={{ fill: 'rgba(142,164,255,0.10)' }} formatter={(value) => formatOneDecimal(value)} />
                      <Bar dataKey="damage" fill="#8ea4ff" radius={[0, 5, 5, 0]}>
                        {damageByPokemon.map((entry) => {
                          const [primaryType] = entry.types;
                          return <Cell key={entry.name} fill={typeColors[primaryType] ?? '#8ea4ff'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Card sx={{ ...cardSurfaceSx, height: 390 }}>
                <CardContent onMouseLeave={clearActiveDamageType} sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight={850}>Damage By Type</Typography>
                    {selectedTypeName && (
                      <Chip
                        label={`${selectedTypeName} | ${formatInt(selectedTypeTotal)}`}
                        size="small"
                        sx={{
                          bgcolor: `${typeColors[selectedTypeName] ?? '#74c0fc'}22`,
                          border: `1px solid ${typeColors[selectedTypeName] ?? '#74c0fc'}66`,
                          color: typeColors[selectedTypeName] ?? '#74c0fc',
                          fontWeight: 900,
                          textTransform: 'capitalize',
                        }}
                      />
                    )}
                  </Stack>
                  <Box
                    onMouseLeave={clearActiveDamageType}
                    sx={{
                      display: 'grid',
                      gap: 1.4,
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'minmax(190px, 1fr) minmax(180px, 0.9fr)',
                        lg: 'minmax(190px, 1fr) minmax(168px, 0.86fr)',
                      },
                      height: 'calc(100% - 38px)',
                      minHeight: 0,
                      transition: 'grid-template-columns 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  >
                    <Box sx={{ minHeight: 0, minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            activeIndex={selectedTypeName ? activeTypeIndex : undefined}
                            activeShape={renderSplitTypeSlice}
                            data={typeDamage}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={94}
                            paddingAngle={2}
                            onMouseEnter={(entry) => setActiveDamageType(entry.name)}
                          >
                            {typeDamage.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={selectedTypeName && entry.name !== selectedTypeName ? 'rgba(132, 146, 166, 0.34)' : (typeColors[entry.name] ?? '#74c0fc')}
                                opacity={selectedTypeName && entry.name !== selectedTypeName ? 0.56 : 1}
                                stroke={entry.name === selectedTypeName ? 'rgba(248,250,252,0.72)' : 'rgba(7,10,16,0.64)'}
                                strokeWidth={entry.name === selectedTypeName ? 2 : 1}
                                style={{ transition: 'fill 160ms ease, opacity 160ms ease, stroke 160ms ease' }}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Stack
                      spacing={0.8}
                      sx={{
                        bgcolor: 'rgba(8, 12, 22, 0.62)',
                        border: `1px solid ${(typeColors[selectedTypeName] ?? '#74c0fc')}33`,
                        borderRadius: 1,
                        boxShadow: `0 14px 34px ${(typeColors[selectedTypeName] ?? '#74c0fc')}18`,
                        minHeight: 0,
                        minWidth: 0,
                        opacity: 1,
                        overflow: 'hidden',
                        p: 1,
                        transform: 'translateX(0) scale(1)',
                        transition: 'opacity 220ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1), padding 220ms ease, border-color 220ms ease, box-shadow 220ms ease',
                      }}
                    >
                      <Typography color="text.secondary" fontSize={11} fontWeight={900} textTransform="uppercase">
                        {selectedTypeName ? 'Pokemon Split' : 'Type Split'}
                      </Typography>
                      <Stack spacing={0.75} sx={{ minHeight: 0, overflow: 'hidden' }}>
                        {selectedTypeName ? typeDamagePokemonSlices.map((pokemon) => {
                          const barColor = pokemon.color ?? typeColors[selectedTypeName] ?? '#74c0fc';
                          return (
                            <Box key={pokemon.name} sx={{ minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={0.8} sx={{ minWidth: 0 }}>
                                {pokemon.isOther ? (
                                  <Box
                                    sx={{
                                      bgcolor: barColor,
                                      border: '1px solid rgba(248,250,252,0.22)',
                                      borderRadius: '50%',
                                      flex: '0 0 auto',
                                      height: 34,
                                      opacity: 0.88,
                                      width: 34,
                                    }}
                                  />
                                ) : (
                                  <PokemonSprite name={pokemon.name} size={34} />
                                )}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
                                    <Typography noWrap fontSize={12.5} fontWeight={850}>{pokemon.name}</Typography>
                                    <Typography color="text.secondary" fontSize={11} fontWeight={800}>
                                      {formatPercent(pokemon.share)}
                                    </Typography>
                                  </Stack>
                                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 5, mt: 0.35, overflow: 'hidden' }}>
                                    <Box
                                      sx={{
                                        bgcolor: barColor,
                                        boxShadow: `0 0 12px ${barColor}66`,
                                        height: '100%',
                                        width: `${clampPercent(pokemon.share)}%`,
                                      }}
                                    />
                                  </Box>
                                </Box>
                                <Typography fontSize={12} fontWeight={900} sx={{ color: typeColors[selectedTypeName] ?? '#74c0fc', minWidth: 44, textAlign: 'right' }}>
                                  {formatInt(pokemon.value)}
                                </Typography>
                              </Stack>
                            </Box>
                          );
                        }) : typeDamageBreakdown.map((type) => {
                          const barColor = typeColors[type.name] ?? '#74c0fc';
                          return (
                            <Box key={type.name} sx={{ minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={0.8} sx={{ minWidth: 0 }}>
                                <Box
                                  sx={{
                                    bgcolor: barColor,
                                    border: '1px solid rgba(248,250,252,0.22)',
                                    borderRadius: '50%',
                                    flex: '0 0 auto',
                                    height: 18,
                                    width: 18,
                                  }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
                                    <Typography noWrap fontSize={12.5} fontWeight={850} sx={{ textTransform: 'capitalize' }}>{type.name}</Typography>
                                    <Typography color="text.secondary" fontSize={11} fontWeight={800}>
                                      {formatPercent(type.share)}
                                    </Typography>
                                  </Stack>
                                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 5, mt: 0.35, overflow: 'hidden' }}>
                                    <Box
                                      sx={{
                                        bgcolor: barColor,
                                        boxShadow: `0 0 12px ${barColor}66`,
                                        height: '100%',
                                        width: `${clampPercent(type.share)}%`,
                                      }}
                                    />
                                  </Box>
                                </Box>
                                <Typography fontSize={12} fontWeight={900} sx={{ color: barColor, minWidth: 44, textAlign: 'right' }}>
                                  {formatInt(type.value)}
                                </Typography>
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <RankCard
                title="Win Leaders"
                metricLabel="wins"
                rows={topWinsRows}
                color="#f2c94c"
                getValue={(row) => formatInt(row.wins)}
                getDetail={(row) => `${formatPercent(row.winRate)} | ${row.battles.toLocaleString()} battles`}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <RankCard
                title="KO Pressure"
                metricLabel="KOs/B"
                rows={pressureRows}
                color="#ff2d87"
                getValue={(row) => formatTwoDecimals(row.avgKos)}
                getDetail={(row) => `${formatInt(row.kos)} KOs | ${row.battles.toLocaleString()} battles`}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <RankCard
                title="Damage Carries"
                metricLabel="damage"
                rows={topDamageRows}
                color="#7b61ff"
                getValue={(row) => formatInt(row.totalDamage)}
                getDetail={(row) => `${formatOneDecimal(row.avgDamage)} avg | ${formatTwoDecimals(row.damageRatio)} ratio`}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <RankCard
                title="Biggest Hits"
                metricLabel="best hit"
                rows={topBestHitRows}
                color="#ffa94d"
                getValue={(row) => (row.bestHit ? formatInt(row.bestHit) : '-')}
                getDetail={(row) => `${formatInt(row.hits)} hits | ${formatInt(row.totalDamage)} damage`}
              />
            </Grid>
          </Grid>

          {filterControls}

          <Card sx={{ ...cardSurfaceSx, overflow: 'hidden', width: '100%' }}>
            <CardContent sx={{ minWidth: 0, position: 'relative', width: '100%', zIndex: 1 }}>
              <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2} sx={{ mb: 1.5 }}>
                <Typography variant="h6" fontWeight={850}>Leaderboard</Typography>
                <Typography color="text.secondary" fontSize={13}>{filteredRows.length.toLocaleString()} visible Pokemon</Typography>
              </Stack>
              <Box sx={{ height: 642, minWidth: 0, overflowX: 'auto', width: '100%' }}>
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  disableRowSelectionOnClick
                  initialState={{
                    sorting: { sortModel: [{ field: 'wins', sort: 'desc' }] },
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                  pageSizeOptions={[25, 50, 100]}
                  rowHeight={76}
                  sx={{
                    bgcolor: 'rgba(10, 13, 23, 0.76)',
                    border: '1px solid rgba(116, 192, 252, 0.16)',
                    minWidth: 1280,
                    width: '100%',
                    '& .MuiDataGrid-columnHeaders': {
                      bgcolor: 'rgba(12, 15, 25, 0.98)',
                      borderBottom: '1px solid rgba(123, 97, 255, 0.32)',
                      color: '#aeb8ca',
                      fontSize: 12,
                      letterSpacing: 0,
                      textTransform: 'uppercase',
                    },
                    '& .MuiDataGrid-row': {
                      bgcolor: 'rgba(16, 20, 33, 0.72)',
                      borderBottom: '1px solid rgba(48,56,75,0.45)',
                    },
                    '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: 'rgba(12, 16, 27, 0.88)' },
                    '& .MuiDataGrid-row:hover': {
                      bgcolor: 'rgba(34, 43, 68, 0.88)',
                      boxShadow: 'inset 3px 0 0 #36d8ff',
                    },
                    '& .MuiDataGrid-cell': {
                      alignItems: 'center',
                      borderColor: 'rgba(48,56,75,0.36)',
                      display: 'flex',
                      lineHeight: 1,
                      py: 0,
                    },
                    '& .MuiDataGrid-cell--textCenter': {
                      justifyContent: 'center',
                    },
                    '& .MuiDataGrid-cell--textCenter > *': {
                      alignItems: 'center',
                      display: 'flex',
                      height: '100%',
                      justifyContent: 'center',
                    },
                    '& .MuiDataGrid-columnHeader--alignCenter .MuiDataGrid-columnHeaderTitleContainer': {
                      justifyContent: 'center',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      bgcolor: 'rgba(12, 15, 25, 0.98)',
                      borderTop: '1px solid rgba(123, 97, 255, 0.28)',
                    },
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
            </>
          )}

          {view === 'profiles' && (
            selectedProfile ? (
              <>
                <Grid container spacing={2} alignItems="stretch">
                  <Grid size={{ xs: 12, lg: 4 }}>
                    <PanelCard
                      sx={{
                        height: '100%',
                        minHeight: 360,
                        '&::after': {
                          background: `linear-gradient(135deg, ${(typeColors[selectedProfileTypes[0]] ?? '#36d8ff')}22, transparent 42%), radial-gradient(circle at 78% 12%, ${(typeColors[selectedProfileTypes[1] || selectedProfileTypes[0]] ?? '#7b61ff')}26, transparent 34%)`,
                          content: '""',
                          inset: 0,
                          pointerEvents: 'none',
                          position: 'absolute',
                        },
                      }}
                      contentSx={{ minHeight: 360 }}
                    >
                      <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2} sx={{ mb: 1.5 }}>
                        <Box>
                          <Typography color="text.secondary" fontSize={12} fontWeight={900} textTransform="uppercase">
                            Profile
                          </Typography>
                          <Typography variant="h5" fontWeight={950} lineHeight={1.05}>
                            {selectedProfile.name}
                          </Typography>
                        </Box>
                        <Typography color="text.secondary" fontSize={13}>
                          {mode === 'overall' ? 'all modes' : mode.toUpperCase()}
                        </Typography>
                      </Stack>
                      <TextField
                        fullWidth
                        select
                        label="Pokemon"
                        value={selectedProfileName}
                        onChange={(event) => setSelectedPokemon(event.target.value)}
                      >
                        {profileRows.map((row) => (
                          <MenuItem key={row.name} value={row.name}>{row.name}</MenuItem>
                        ))}
                      </TextField>
                      <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', mt: 2 }}>
                        <Box
                          sx={{
                            alignItems: 'center',
                            background: `linear-gradient(145deg, rgba(5,7,12,0.84), ${(typeColors[selectedProfileTypes[0]] ?? '#36d8ff')}18)`,
                            border: `1px solid ${(typeColors[selectedProfileTypes[0]] ?? '#36d8ff')}55`,
                            borderRadius: 2,
                            boxShadow: `0 22px 54px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 32px ${(typeColors[selectedProfileTypes[0]] ?? '#36d8ff')}16`,
                            display: 'grid',
                            height: 168,
                            placeItems: 'center',
                            width: 198,
                          }}
                        >
                          <PokemonSprite name={selectedProfile.name} size={146} framed={false} />
                        </Box>
                        <Typography fontSize={30} fontWeight={900} lineHeight={1} sx={{ mt: 1.6 }}>
                          {selectedProfile.name}
                        </Typography>
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" justifyContent="center" sx={{ mt: 1 }}>
                          {selectedProfileTypes.map((type) => <TypeBadge key={type} type={type} />)}
                        </Stack>
                        <Typography color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                          {selectedProfile.battles.toLocaleString()} battles / {formatInt(selectedProfile.wins)} wins / {formatInt(selectedProfile.kos)} KOs
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 2.5 }}>
                        <Typography color="text.secondary" fontSize={12} fontWeight={900} textAlign="center" textTransform="uppercase" sx={{ mb: 1 }}>
                          Abilities
                        </Typography>
                        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" justifyContent="center">
                          {selectedProfileAbilities.length ? selectedProfileAbilities.map((ability) => (
                            <AbilityBadge key={`${ability.name}-${ability.hidden ? 'hidden' : 'regular'}`} ability={ability} />
                          )) : (
                            <Typography color="text.secondary" fontSize={13}>No ability data found for this Pokemon.</Typography>
                          )}
                        </Stack>
                      </Box>
                    </PanelCard>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 8 }}>
                    <BattleGlyphPanel metrics={profileGlyphMetrics} />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <ProfileStatCard label="Win Rate" value={formatPercent(selectedProfile.winRate)} detail={`${formatInt(selectedProfile.wins)} wins`} color="#f2c94c" progress={selectedProfile.winRate} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <ProfileStatCard label="Survival" value={formatPercent(selectedProfile.survivalRate)} detail={`${formatInt(selectedProfile.deaths)} deaths`} color="#50e36b" progress={selectedProfile.survivalRate} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <ProfileStatCard label="KOs Per Battle" value={formatTwoDecimals(selectedProfile.avgKos)} detail={`${formatInt(selectedProfile.kos)} total KOs`} color="#ff2d87" progress={(selectedProfile.avgKos / maxStats.avgKos) * 100} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <ProfileStatCard label="Damage Ratio" value={formatTwoDecimals(selectedProfile.damageRatio)} detail={`${formatInt(selectedProfile.damageTaken)} taken`} color="#36d8ff" progress={(selectedProfile.damageRatio / maxStats.damageRatio) * 100} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <ProfileStatCard label="Total Damage" value={formatInt(selectedProfile.totalDamage)} detail={`${formatOneDecimal(selectedProfile.avgDamage)} avg`} color="#7b61ff" progress={(selectedProfile.totalDamage / maxStats.totalDamage) * 100} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                    <ProfileStatCard label="Best Hit" value={selectedProfile.bestHit ? formatInt(selectedProfile.bestHit) : '-'} detail={`${formatInt(selectedProfile.hits)} hits landed`} color="#ffa94d" progress={(selectedProfile.bestHit / maxStats.bestHit) * 100} />
                  </Grid>
                </Grid>

                <Grid container spacing={2} alignItems="stretch">
                  <Grid size={{ xs: 12, lg: 5 }}>
                    <PanelCard sx={{ height: '100%', minHeight: 270 }}>
                      <SectionHeader title="Base Stats" detail={selectedProfileStats?.bst ? `BST ${formatInt(selectedProfileStats.bst)}` : ''} />
                      {selectedProfileStats ? (
                        <BaseStatsGraph stats={selectedProfileStats} />
                      ) : (
                        <Typography color="text.secondary">No base stat data found for this Pokemon.</Typography>
                      )}
                    </PanelCard>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 7 }}>
                    <PanelCard sx={{ minHeight: 360 }}>
                      <SectionHeader title="Mode Splits" detail={`${selectedProfileModes.length} modes`} />
                      <Stack spacing={1.5}>
                        {selectedProfileModes.length ? selectedProfileModes.map((row) => (
                          <ModeSplitRow key={row.mode} row={row} />
                        )) : (
                          <Typography color="text.secondary">No mode split recorded for this Pokemon.</Typography>
                        )}
                      </Stack>
                    </PanelCard>
                  </Grid>
                </Grid>

                <Grid container spacing={2} alignItems="stretch">
                  <Grid size={{ xs: 12, lg: 5 }}>
                    <MovePoolPanel moves={profileMovePicks} sampleCount={selectedProfile.movePoolCount} />
                  </Grid>
                  <Grid size={{ xs: 12, lg: 7 }}>
                    <PanelCard sx={{ minHeight: 280 }}>
                      <SectionHeader title="Damage Mix" detail={formatInt(selectedProfile.totalDamage)} />
                      <Stack spacing={1.5}>
                        {profileTypeDamage.length ? profileTypeDamage.map((type) => (
                          <StatMeter
                            key={type.name}
                            label={type.name}
                            value={formatInt(type.value)}
                            detail={`${formatPercent(pct(type.value, selectedProfile.totalDamage))} of damage`}
                            color={typeColors[type.name] ?? '#36d8ff'}
                            progress={pct(type.value, selectedProfile.totalDamage)}
                          />
                        )) : (
                          <Typography color="text.secondary">No type damage recorded for this Pokemon.</Typography>
                        )}
                      </Stack>
                    </PanelCard>
                  </Grid>
                </Grid>
              </>
            ) : (
              <EmptyStateCard title="No Pokemon Match The Current Filters" detail="Lower the minimum battle count or clear the search filter." />
            )
          )}

          {view === 'survival' && (
            <>
              {filterControls}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                <PanelCard sx={{ minHeight: 520 }}>
                  <SectionHeader title="Threat Tiers" detail="survival, time alive, DPS, and KOs" />
                  {threatTierRows.length ? (
                    <Box
                      sx={{
                        background:
                          'linear-gradient(135deg, rgba(242,201,76,0.08), rgba(80,227,107,0.06), rgba(54,216,255,0.06), rgba(255,45,135,0.07)), radial-gradient(circle at 86% 12%, rgba(242,201,76,0.13), transparent 28%), rgba(7,10,19,0.30)',
                        border: '1px solid rgba(132, 146, 166, 0.16)',
                        borderRadius: 1,
                        minHeight: 430,
                        overflow: 'hidden',
                        p: { xs: 1, md: 1.5 },
                        position: 'relative',
                      }}
                    >
                      <Stack spacing={1.25}>
                        {threatTierBands.map((tier) => (
                          <Box
                            key={tier.id}
                            sx={{
                              bgcolor: 'rgba(7, 10, 19, 0.54)',
                              border: `1px solid ${tier.color}33`,
                              borderRadius: 1,
                              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 28px ${tier.color}12`,
                              display: 'grid',
                              gap: 1,
                              gridTemplateColumns: { xs: '56px 1fr', md: '76px 1fr' },
                              minHeight: 92,
                              overflow: 'hidden',
                              p: 1,
                            }}
                          >
                            <Box
                              sx={{
                                alignItems: 'center',
                                borderRight: `1px solid ${tier.color}33`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                pr: 1,
                              }}
                            >
                              <Typography sx={{ color: tier.color, fontSize: { xs: 30, md: 40 }, fontWeight: 950, lineHeight: 0.9 }}>
                                {tier.label}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                alignItems: 'center',
                                display: 'grid',
                                gap: { xs: 0.75, md: 1 },
                                gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
                                minWidth: 0,
                              }}
                            >
                              {tier.rows.map((row) => {
                                const color = typeColors[row.primaryType] ?? tier.color;
                                return (
                                  <Box
                                    key={row.name}
                                    title={`${row.name}: ${formatPercent(row.survivalRate)} survival, ${formatDuration(row.avgTimeAlive)} alive, ${formatTwoDecimals(row.avgDps)} DPS, ${formatTwoDecimals(row.avgKos)} KOs/B`}
                                    sx={{
                                      alignItems: 'center',
                                      bgcolor: 'rgba(13, 17, 25, 0.58)',
                                      border: `1px solid ${color}44`,
                                      borderRadius: 1,
                                      boxShadow: `0 0 ${10 + row.threatMeter * 0.18}px ${color}24`,
                                      display: 'flex',
                                      justifyContent: 'center',
                                      minWidth: 0,
                                      p: 0.8,
                                      position: 'relative',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        alignItems: 'center',
                                        display: 'flex',
                                        height: { xs: 66, md: 76 },
                                        justifyContent: 'center',
                                        width: { xs: 66, md: 76 },
                                      }}
                                    >
                                      <PokemonSprite name={row.name} size={72} framed={false} />
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  ) : (
                    <Box sx={{ alignItems: 'center', color: 'text.secondary', display: 'flex', height: 430, justifyContent: 'center', textAlign: 'center' }}>
                      New saved fights will populate threat tiers once survival data exists.
                    </Box>
                  )}
                </PanelCard>
              </Grid>
              <Grid size={{ xs: 12, md: 6, xl: 3 }}>
                <RankCard
                  title="Survivors"
                  metricLabel="survival"
                  rows={survivalLeaders}
                  color="#50e36b"
                  getValue={(row) => formatPercent(row.survivalRate)}
                  getDetail={(row) => `${formatInt(row.wins)} wins | ${formatInt(row.deaths)} deaths`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, xl: 3 }}>
                <RankCard
                  title="Survival Experts"
                  metricLabel="avg time alive"
                  rows={survivalExpertRows}
                  color="#7b61ff"
                  getValue={(row) => formatDuration(row.avgTimeAlive)}
                  getDetail={(row) => `${formatInt(row.battles)} battles | ${formatPercent(row.survivalRate)} survival`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, xl: 3 }}>
                <RankCard
                  title="Consistent Performers"
                  metricLabel="avg DPS"
                  rows={consistentPerformerRows}
                  color="#ff2d87"
                  getValue={(row) => formatTwoDecimals(row.avgDps)}
                  getDetail={(row) => `${formatOneDecimal(row.avgDamage)} avg damage | ${formatDuration(row.avgTimeAlive)} alive`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, xl: 3 }}>
                <RankCard
                  title="Closer Threats"
                  metricLabel="finishes"
                  rows={[...filteredRows].sort((a, b) => b.finishes - a.finishes || b.wins - a.wins)}
                  color="#ffa94d"
                  getValue={(row) => formatInt(row.finishes)}
                  getDetail={(row) => `${formatInt(row.wins)} wins | ${formatInt(row.kos)} KOs`}
                />
              </Grid>
              </Grid>
            </>
          )}

          {view === 'recaps' && (
            recapGroups.length ? (
              <Box sx={recapGridSx}>
                {recapGroups.map((group) => (
                  group.type === 'tournament' ? (
                    <TournamentRecapGroup
                      key={group.id}
                      group={group}
                      pendingFightActions={pendingFightActions}
                      onExclude={excludeFightFromViewer}
                      onRestore={restoreFightToViewer}
                      onIncludeYoutube={includeFightInYoutube}
                      onRemoveYoutube={removeFightFromYoutube}
                    />
                  ) : (
                    <Box key={group.id} sx={{ minWidth: 0 }}>
                      <FightRecapCard
                        entry={group.entry}
                        isPending={pendingFightActions.has(getFightEntryKey(group.entry))}
                        onExclude={excludeFightFromViewer}
                        onRestore={restoreFightToViewer}
                        onIncludeYoutube={includeFightInYoutube}
                        onRemoveYoutube={removeFightFromYoutube}
                      />
                    </Box>
                  )
                ))}
              </Box>
            ) : (
              <EmptyStateCard
                title="No Fight Recaps In This Export"
                detail={mode === 'overall'
                  ? 'Load pokemon_video_stats.json to show saved fights, winners, fighters, MVPs, elimination order, damage, and best-hit cards.'
                  : `No saved ${mode.toUpperCase()} fights matched this export.`}
              />
            )
          )}
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
