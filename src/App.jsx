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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import exportedStats from '../pokemon_stats.json';
import pokemonDex from './pokemonDex.json';
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

const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const pct = (part, total) => (total ? (part / total) * 100 : 0);
const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const formatInt = (value) => Math.round(number(value)).toLocaleString();
const formatOneDecimal = (value) => number(value).toFixed(1);
const formatTwoDecimals = (value) => number(value).toFixed(2);
const formatPercent = (value) => `${formatOneDecimal(value)}%`;
const clampPercent = (value) => Math.min(100, Math.max(0, number(value)));

const views = [
  { id: 'overview', label: 'Overview' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'survival', label: 'Survival' },
  { id: 'recaps', label: 'Fight Recaps' },
];

const liveStatsSources = [
  {
    label: 'Live game stats',
    url: '/@fs/C:/Users/Cory/Documents/coding/pokemon_stats.json',
  },
  {
    label: 'Live video stats',
    url: '/@fs/C:/Users/Cory/Documents/coding/pokemon_video_stats.json',
  },
];

const fallbackStatsSource = 'Bundled repo stats';

const statSetLabels = {
  lifetime: 'Lifetime',
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

const tagLabel = (tag) => tag.replace(/_/g, ' ');

const gradientIdForPokemon = (name) => `type-split-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

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
  const deathRankCount = number(raw.death_rank_count);
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
    bestHit: number(raw.best_hit),
    avgDamage: totalDamage / safeBattles,
    avgDamageTaken: damageTaken / safeBattles,
    avgHit: hits ? totalDamage / hits : 0,
    avgKos: kos / safeBattles,
    avgDeaths: deaths / safeBattles,
    avgDeathRank: deathRankCount ? number(raw.death_rank_total) / deathRankCount : 0,
    damageRatio: totalDamage / Math.max(1, damageTaken),
    survivalRate: pct(Math.max(0, battles - deaths), safeBattles),
    moveTypes: raw.damage_by_type ?? {},
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

const normalizeStats = (raw) => {
  if (raw?.overall && raw?.by_mode) {
    const base = normalizeStatsRoot(raw);
    const fightStats = raw.fight_stats ?? raw;
    const curated = normalizeStatsRoot(fightStats);
    const leaderboardSets = {
      lifetime: base,
      overall: curated,
      youtube: normalizeStatsRoot(fightStats.leaderboards?.youtube),
      solo: normalizeStatsRoot(fightStats.leaderboards?.solo),
    };
    return {
      ...curated,
      leaderboardSets,
      version: raw.version,
      entries: Array.isArray(fightStats.entries) ? fightStats.entries : [],
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
      entries: Array.isArray(raw.entries) ? raw.entries : [],
    };
  }

  throw new Error('Expected either `overall` + `by_mode` stats or legacy `pokemon` stats.');
};

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
      background:
        'linear-gradient(180deg, rgba(20, 24, 38, 0.98), rgba(12, 15, 25, 0.98))',
      borderColor: 'rgba(116, 192, 252, 0.16)',
      minHeight: 190,
      overflow: 'hidden',
      position: 'relative',
      '&::after': {
        background: `linear-gradient(135deg, ${color}22, transparent 46%)`,
        content: '""',
        height: 90,
        position: 'absolute',
        right: -30,
        top: -34,
        transform: 'skewX(-18deg)',
        width: 170,
      },
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
      background:
        'linear-gradient(180deg, rgba(19, 23, 37, 0.98), rgba(10, 13, 23, 0.98))',
      borderColor: 'rgba(116, 192, 252, 0.16)',
      overflow: 'hidden',
      position: 'relative',
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
        bgcolor: 'rgba(7, 10, 19, 0.52)',
        border: '1px solid rgba(116, 192, 252, 0.12)',
        borderRadius: 2,
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
            bgcolor: 'rgba(14, 18, 31, 0.82)',
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

const FightRecapCard = ({ entry }) => {
  const fighters = Array.isArray(entry.fighters) ? entry.fighters : [];
  const winnerNames = new Set(entry.winners ?? (entry.winner ? [entry.winner] : []));
  const winner = fighters.find((fighter) => winnerNames.has(fighter.name)) ?? fighters.find((fighter) => fighter.winner);
  const statStatus = entry.stat_status ?? entry.video_status ?? 'active';
  const isExcluded = ['excluded', 'deleted', 'broken'].includes(statStatus);
  const isRoyale = String(entry.mode ?? '').toLowerCase().includes('royale');
  const statGroups = new Set(Array.isArray(entry.stat_groups) ? entry.stat_groups : []);
  if (entry.video_status === 'included') statGroups.add('youtube');
  const groupLabel = [
    isExcluded ? 'Excluded' : 'Overall',
    statGroups.has('youtube') ? 'YouTube' : null,
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

  return (
    <PanelCard sx={{ minHeight: 290 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography color="text.secondary" fontSize={12} fontWeight={850} textTransform="uppercase">
            {entry.mode ?? 'battle'} #{entry.id}
          </Typography>
          <Typography fontSize={24} fontWeight={900} sx={{ mt: 0.5 }}>
            {winner?.name ?? entry.winner ?? 'No winner'}
          </Typography>
          <Typography color="text.secondary" fontSize={13}>{entry.saved_at}</Typography>
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
                  {isRoyale && team.fighters.length === 1 ? team.fighters[0].name : `Team ${number(team.team) + 1}`}
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

function App() {
  const [stats, setStats] = useState(exportedStats);
  const [statsSource, setStatsSource] = useState(fallbackStatsSource);
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
          setStatsLoadedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
          setError('');
          return;
        } catch {
          // Try the next configured local stats file before falling back.
        }
      }

      if (!cancelled && !liveStatsTextRef.current) {
        setStatsSource(fallbackStatsSource);
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

  const kpis = useMemo(() => {
    const totalBattles = filteredRows.reduce((sum, p) => sum + p.battles, 0);
    const wins = filteredRows.reduce((sum, p) => sum + p.wins, 0);
    const totalKos = filteredRows.reduce((sum, p) => sum + p.kos, 0);
    const totalDamage = filteredRows.reduce((sum, p) => sum + p.totalDamage, 0);
    const topDamage = topBy(filteredRows, 'totalDamage');
    return {
      pokemonCount: filteredRows.length,
      totalBattles,
      totalDamage,
      totalKos,
      winRate: pct(wins, totalBattles),
      mostWins: topBy(filteredRows, 'wins'),
      mostKos: topBy(filteredRows, 'kos'),
      topDamage,
      avgKos: avg(filteredRows.map((p) => p.avgKos)),
      avgDeaths: avg(filteredRows.map((p) => p.avgDeaths)),
    };
  }, [filteredRows]);

  const damageByPokemon = filteredRows
    .filter((p) => p.totalDamage > 0)
    .sort((a, b) => b.totalDamage - a.totalDamage)
    .slice(0, 14)
    .map((p) => ({ name: p.name, damage: p.totalDamage, types: getPokemonTypes(p.name) }));
  const typeDamage = flattenMoveTypes(filteredRows).slice(0, 12);
  const profileTypeDamage = selectedProfile ? flattenMoveTypes([selectedProfile]).slice(0, 7) : [];
  const maxStats = useMemo(() => ({
    avgKos: Math.max(1, ...profileRows.map((p) => p.avgKos)),
    totalDamage: Math.max(1, ...profileRows.map((p) => p.totalDamage)),
    bestHit: Math.max(1, ...profileRows.map((p) => p.bestHit)),
    damageRatio: Math.max(1, ...profileRows.map((p) => p.damageRatio)),
  }), [profileRows]);
  const topWinsRows = [...filteredRows].sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  const topDamageRows = [...filteredRows].sort((a, b) => b.totalDamage - a.totalDamage);
  const topBestHitRows = [...filteredRows].sort((a, b) => b.bestHit - a.bestHit);
  const survivalLeaders = [...filteredRows].sort((a, b) => b.survivalRate - a.survivalRate || b.wins - a.wins);
  const deepRunRows = [...filteredRows]
    .filter((p) => p.avgDeathRank > 0)
    .sort((a, b) => b.avgDeathRank - a.avgDeathRank || b.survivalRate - a.survivalRate);
  const earlyExitRows = [...filteredRows]
    .filter((p) => p.avgDeathRank > 0)
    .sort((a, b) => a.avgDeathRank - b.avgDeathRank || b.deaths - a.deaths);
  const pressureRows = [...filteredRows].sort((a, b) => b.avgKos - a.avgKos || b.totalDamage - a.totalDamage);
  const recentEntries = [...normalizedStats.entries]
    .filter((entry) => mode === 'overall' || String(entry.mode ?? '').toLowerCase() === String(mode).toLowerCase())
    .slice(-8)
    .reverse();

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
    { label: 'Pokemon', value: kpis.pokemonCount, detail: `${kpis.totalBattles.toLocaleString()} total battles`, color: '#36d8ff', progress: Math.min(100, (kpis.pokemonCount / Math.max(1, activeStats.overall.length)) * 100) },
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
    { field: 'damageRatio', headerName: 'Ratio', width: 92, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone={value >= 1 ? 'green' : 'muted'} value={formatTwoDecimals(value)} /> },
    { field: 'hits', headerName: 'Hits', width: 78, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} value={formatInt(value)} /> },
    { field: 'bestHit', headerName: 'Best Hit', width: 98, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="orange" value={value ? formatInt(value) : '-'} /> },
    { field: 'finishes', headerName: 'Finishes', width: 96, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="orange" value={formatInt(value)} /> },
    { field: 'deaths', headerName: 'Deaths', width: 88, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone="red" value={formatInt(value)} /> },
    { field: 'survivalRate', headerName: 'Survival', width: 104, align: 'center', headerAlign: 'center', renderCell: ({ value }) => <StatValue align="center" fontSize={18} tone={value >= 50 ? 'green' : 'muted'} value={formatOneDecimal(value)} suffix="%" /> },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(155deg, rgba(123, 97, 255, 0.28) 0 13%, transparent 13% 100%), linear-gradient(18deg, transparent 0 64%, rgba(255, 45, 135, 0.28) 64% 78%, transparent 78% 100%), #070a13',
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1460, py: { xs: 2.5, md: 3.5 } }}>
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
              <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
                Export v{normalizedStats.version ?? 'unknown'} loaded. Showing {statSetLabels[statSet] ?? statSet} {mode === 'overall' ? 'overall' : mode.toUpperCase()} performance from {activeStats.overall.length.toLocaleString()} Pokemon records.
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.2 }}>
                <Chip
                  label={statsSource}
                  size="small"
                  sx={{
                    bgcolor: autoRefresh ? 'rgba(80, 227, 107, 0.14)' : 'rgba(123, 97, 255, 0.16)',
                    border: `1px solid ${autoRefresh ? 'rgba(80, 227, 107, 0.35)' : 'rgba(123, 97, 255, 0.36)'}`,
                    color: '#dde6f5',
                    fontWeight: 800,
                  }}
                />
                {statsLoadedAt && (
                  <Chip
                    label={`Updated ${statsLoadedAt}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(12, 15, 25, 0.64)',
                      border: '1px solid rgba(116, 192, 252, 0.18)',
                      color: '#aeb8ca',
                      fontWeight: 800,
                    }}
                  />
                )}
              </Stack>
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
              background: 'linear-gradient(135deg, rgba(17, 21, 36, 0.9), rgba(7, 10, 19, 0.72))',
              border: '1px solid rgba(116, 192, 252, 0.16)',
              borderRadius: 3,
              boxShadow: '0 18px 44px rgba(0, 0, 0, 0.24)',
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

          {(view === 'overview' || view === 'survival') && (
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
          )}

          {view === 'overview' && (
            <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ height: 390 }}>
                <CardContent sx={{ height: '100%' }}>
                  <Typography variant="h6" fontWeight={850} gutterBottom>Top Damage</Typography>
                  <ResponsiveContainer width="100%" height="88%">
                    <BarChart data={damageByPokemon} layout="vertical" margin={{ left: 28, right: 24, top: 8, bottom: 8 }}>
                      <defs>
                        {damageByPokemon.map((entry) => {
                          const [primaryType, secondaryType] = entry.types;
                          if (!secondaryType) return null;
                          return (
                            <linearGradient key={entry.name} id={gradientIdForPokemon(entry.name)} x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={typeColors[primaryType] ?? '#74c0fc'} />
                              <stop offset="50%" stopColor={typeColors[primaryType] ?? '#74c0fc'} />
                              <stop offset="50%" stopColor={typeColors[secondaryType] ?? '#9b7bff'} />
                              <stop offset="100%" stopColor={typeColors[secondaryType] ?? '#9b7bff'} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <CartesianGrid stroke="rgba(74,85,111,0.42)" horizontal={false} />
                      <XAxis type="number" stroke="#9ca8ba" />
                      <YAxis dataKey="name" type="category" width={98} stroke="#c8d2e4" />
                      <Tooltip {...chartTooltipProps} cursor={{ fill: 'rgba(123,97,255,0.10)' }} formatter={(value) => formatOneDecimal(value)} />
                      <Bar dataKey="damage" fill="#7b61ff" radius={[0, 5, 5, 0]}>
                        {damageByPokemon.map((entry) => {
                          const [primaryType, secondaryType] = entry.types;
                          return (
                            <Cell
                              key={entry.name}
                              fill={secondaryType ? `url(#${gradientIdForPokemon(entry.name)})` : (typeColors[primaryType] ?? '#7b61ff')}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Card sx={{ height: 390 }}>
                <CardContent sx={{ height: '100%' }}>
                  <Typography variant="h6" fontWeight={850} gutterBottom>Damage By Type</Typography>
                  <ResponsiveContainer width="100%" height="88%">
                    <PieChart>
                      <Pie data={typeDamage} dataKey="value" nameKey="name" innerRadius={58} outerRadius={112} paddingAngle={2}>
                        {typeDamage.map((entry) => (
                          <Cell key={entry.name} fill={typeColors[entry.name] ?? '#74c0fc'} />
                        ))}
                      </Pie>
                      <Tooltip {...chartTooltipProps} formatter={(value) => formatOneDecimal(value)} />
                    </PieChart>
                  </ResponsiveContainer>
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

          <Card sx={{ overflow: 'hidden', width: '100%' }}>
            <CardContent sx={{ minWidth: 0, width: '100%' }}>
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
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, lg: 4 }}>
                    <PanelCard sx={{ minHeight: 474 }} contentSx={{ minHeight: 474 }}>
                      <SectionHeader title="Pokemon Profile" detail={mode === 'overall' ? 'all modes' : mode.toUpperCase()} />
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
                      <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', mt: 3 }}>
                        <Box
                          sx={{
                            alignItems: 'center',
                            background: 'conic-gradient(#36d8ff 0 36%, #7b61ff 36% 68%, #ff2d87 68% 100%)',
                            borderRadius: '50%',
                            display: 'grid',
                            height: 186,
                            placeItems: 'center',
                            width: 186,
                          }}
                        >
                          <Box
                            sx={{
                              alignItems: 'center',
                              bgcolor: '#0b0e18',
                              borderRadius: '50%',
                              display: 'grid',
                              height: 142,
                              placeItems: 'center',
                              width: 142,
                            }}
                          >
                            <PokemonSprite name={selectedProfile.name} size={132} framed={false} />
                          </Box>
                        </Box>
                        <Typography fontSize={32} fontWeight={900} lineHeight={1} sx={{ mt: 2 }}>
                          {selectedProfile.name}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                          {selectedProfile.battles.toLocaleString()} battles | {formatInt(selectedProfile.wins)} wins | {formatInt(selectedProfile.kos)} KOs
                        </Typography>
                      </Box>
                    </PanelCard>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 8 }}>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
                        <ProfileStatCard label="Win Rate" value={formatPercent(selectedProfile.winRate)} detail={`${formatInt(selectedProfile.wins)} wins`} color="#f2c94c" progress={selectedProfile.winRate} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
                        <ProfileStatCard label="Survival" value={formatPercent(selectedProfile.survivalRate)} detail={`${formatInt(selectedProfile.deaths)} deaths`} color="#50e36b" progress={selectedProfile.survivalRate} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
                        <ProfileStatCard label="KOs Per Battle" value={formatTwoDecimals(selectedProfile.avgKos)} detail={`${formatInt(selectedProfile.kos)} total KOs`} color="#ff2d87" progress={(selectedProfile.avgKos / maxStats.avgKos) * 100} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
                        <ProfileStatCard label="Damage Ratio" value={formatTwoDecimals(selectedProfile.damageRatio)} detail={`${formatInt(selectedProfile.damageTaken)} taken`} color="#36d8ff" progress={(selectedProfile.damageRatio / maxStats.damageRatio) * 100} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
                        <ProfileStatCard label="Total Damage" value={formatInt(selectedProfile.totalDamage)} detail={`${formatOneDecimal(selectedProfile.avgDamage)} avg`} color="#7b61ff" progress={(selectedProfile.totalDamage / maxStats.totalDamage) * 100} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
                        <ProfileStatCard label="Best Hit" value={selectedProfile.bestHit ? formatInt(selectedProfile.bestHit) : '-'} detail={`${formatInt(selectedProfile.hits)} hits landed`} color="#ffa94d" progress={(selectedProfile.bestHit / maxStats.bestHit) * 100} />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, lg: 6 }}>
                    <PanelCard sx={{ minHeight: 360 }}>
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
                  <Grid size={{ xs: 12, lg: 6 }}>
                    <PanelCard sx={{ minHeight: 360 }}>
                      <SectionHeader title="Mode Splits" detail={`${selectedProfileModes.length} modes`} />
                      <Stack spacing={1.2}>
                        {selectedProfileModes.length ? selectedProfileModes.map((row) => (
                          <Box
                            key={row.mode}
                            sx={{
                              bgcolor: 'rgba(15, 19, 32, 0.82)',
                              border: '1px solid rgba(58, 66, 92, 0.48)',
                              borderRadius: 2,
                              p: 1.35,
                            }}
                          >
                            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
                              <Typography fontWeight={850}>{row.mode.toUpperCase()}</Typography>
                              <Typography color="#36d8ff" fontWeight={900}>{formatPercent(row.winRate)}</Typography>
                            </Stack>
                            <Grid container spacing={1.2} sx={{ mt: 1 }}>
                              <Grid size={3}><StatValue tone="blue" value={formatInt(row.battles)} /></Grid>
                              <Grid size={3}><StatValue tone="gold" value={formatInt(row.wins)} /></Grid>
                              <Grid size={3}><StatValue tone="red" value={formatInt(row.kos)} /></Grid>
                              <Grid size={3}><StatValue tone="purple" value={formatInt(row.totalDamage)} /></Grid>
                            </Grid>
                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.6 }}>
                              <Typography color="text.secondary" fontSize={11}>Battles</Typography>
                              <Typography color="text.secondary" fontSize={11}>Wins</Typography>
                              <Typography color="text.secondary" fontSize={11}>KOs</Typography>
                              <Typography color="text.secondary" fontSize={11}>Damage</Typography>
                            </Stack>
                          </Box>
                        )) : (
                          <Typography color="text.secondary">No mode split recorded for this Pokemon.</Typography>
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
            <Grid container spacing={2}>
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
                  title="Deep Runs"
                  metricLabel="avg death rank"
                  rows={deepRunRows}
                  color="#7b61ff"
                  getValue={(row) => formatTwoDecimals(row.avgDeathRank)}
                  getDetail={(row) => `${formatInt(row.deaths)} recorded eliminations`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, xl: 3 }}>
                <RankCard
                  title="Early Exits"
                  metricLabel="avg death rank"
                  rows={earlyExitRows}
                  color="#ff2d87"
                  getValue={(row) => formatTwoDecimals(row.avgDeathRank)}
                  getDetail={(row) => `${formatInt(row.deaths)} deaths | ${formatPercent(row.survivalRate)} survival`}
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
              <Grid size={{ xs: 12, lg: 7 }}>
                <PanelCard sx={{ height: 390 }}>
                  <SectionHeader title="Survival Rate Leaders" detail="top 14" />
                  <ResponsiveContainer width="100%" height={310}>
                    <BarChart data={survivalLeaders.slice(0, 14)} layout="vertical" margin={{ left: 28, right: 24, top: 8, bottom: 8 }}>
                      <CartesianGrid stroke="rgba(74,85,111,0.42)" horizontal={false} />
                      <XAxis type="number" stroke="#9ca8ba" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={98} stroke="#c8d2e4" />
                      <Tooltip {...chartTooltipProps} cursor={{ fill: 'rgba(80,227,107,0.10)' }} formatter={(value) => formatPercent(value)} />
                      <Bar dataKey="survivalRate" fill="#50e36b" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </PanelCard>
              </Grid>
              <Grid size={{ xs: 12, lg: 5 }}>
                <PanelCard sx={{ height: 390 }}>
                  <SectionHeader title="Knockout Pressure" detail="KOs per battle" />
                  <Stack spacing={1.4}>
                    {pressureRows.slice(0, 6).map((row) => (
                      <StatMeter
                        key={row.name}
                        label={row.name}
                        value={formatTwoDecimals(row.avgKos)}
                        detail={`${formatInt(row.kos)} KOs in ${row.battles.toLocaleString()} battles`}
                        color="#ff2d87"
                        progress={(row.avgKos / Math.max(1, pressureRows[0]?.avgKos ?? 1)) * 100}
                      />
                    ))}
                  </Stack>
                </PanelCard>
              </Grid>
            </Grid>
          )}

          {view === 'recaps' && (
            recentEntries.length ? (
              <Grid container spacing={2}>
                {recentEntries.map((entry) => (
                  <Grid key={entry.id} size={{ xs: 12, lg: 6 }}>
                    <FightRecapCard entry={entry} />
                  </Grid>
                ))}
              </Grid>
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
