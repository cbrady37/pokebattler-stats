import { useMemo, useState } from 'react';
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

const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const pct = (part, total) => (total ? (part / total) * 100 : 0);
const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const formatInt = (value) => Math.round(number(value)).toLocaleString();
const formatOneDecimal = (value) => number(value).toFixed(1);
const formatTwoDecimals = (value) => number(value).toFixed(2);
const formatPercent = (value) => `${formatOneDecimal(value)}%`;

const spritePath = (name, icon = false) => {
  const dex = pokemonDex[name];
  if (!dex) return '';
  return `/sprite_cache/${dex}${icon ? '_icon' : ''}.png`;
};

function PokemonSprite({ name, size = 34 }) {
  const [fallback, setFallback] = useState(0);
  const src = fallback === 0 ? spritePath(name) : spritePath(name, true);

  if (!src || fallback > 1) {
    return (
      <Box
        sx={{
          alignItems: 'center',
          bgcolor: '#0d1118',
          border: '1px solid #2f3748',
          borderRadius: 2,
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
        bgcolor: '#0d1118',
        border: '1px solid #2f3748',
        borderRadius: 2,
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

const normalizeStats = (raw) => {
  if (raw?.overall && raw?.by_mode) {
    const overall = Object.entries(raw.overall).map(normalizePokemonEntry);
    const byMode = Object.fromEntries(
      Object.entries(raw.by_mode).map(([mode, pokemon]) => [
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
      version: raw.version,
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
    return { overall, byMode: {}, modes: [], version: raw.version };
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

const StatPill = ({ value, tone = 'default' }) => {
  const colors = {
    default: { bgcolor: 'rgba(37, 45, 62, 0.78)', color: '#dde6f5' },
    blue: { bgcolor: 'rgba(116, 192, 252, 0.14)', color: '#74c0fc' },
    gold: { bgcolor: 'rgba(242, 201, 76, 0.14)', color: '#f2c94c' },
    green: { bgcolor: 'rgba(105, 219, 124, 0.14)', color: '#69db7c' },
    red: { bgcolor: 'rgba(255, 107, 107, 0.14)', color: '#ff6b6b' },
    pink: { bgcolor: 'rgba(247, 131, 172, 0.14)', color: '#f783ac' },
    orange: { bgcolor: 'rgba(255, 169, 77, 0.14)', color: '#ffa94d' },
  };
  return (
    <Box
      component="span"
      sx={{
        ...colors[tone],
        alignItems: 'center',
        borderRadius: 1.5,
        display: 'inline-flex',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 750,
        justifyContent: 'center',
        minWidth: 48,
        px: 0.875,
        py: 0.35,
      }}
    >
      {value}
    </Box>
  );
};

function App() {
  const [stats, setStats] = useState(exportedStats);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('overall');
  const [search, setSearch] = useState('');
  const [minBattles, setMinBattles] = useState(0);
  const normalizedStats = useMemo(() => normalizeStats(stats), [stats]);

  const availableModes = useMemo(
    () => ['overall', ...normalizedStats.modes.map((item) => item.mode)],
    [normalizedStats],
  );

  const activePokemon = mode === 'overall'
    ? normalizedStats.overall
    : normalizedStats.byMode[mode] ?? [];

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activePokemon
      .filter((p) => p.battles >= minBattles)
      .filter((p) => !query || p.name.toLowerCase().includes(query))
      .sort((a, b) => b.wins - a.wins || b.kos - a.kos || b.battles - a.battles || a.name.localeCompare(b.name))
      .map((p, idx) => ({ ...p, id: p.name, rank: idx + 1 }));
  }, [activePokemon, minBattles, search]);

  const kpis = useMemo(() => {
    const totalBattles = filteredRows.reduce((sum, p) => sum + p.battles, 0);
    const wins = filteredRows.reduce((sum, p) => sum + p.wins, 0);
    const topDamage = topBy(filteredRows, 'totalDamage');
    return {
      pokemonCount: filteredRows.length,
      totalBattles,
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
    .map((p) => ({ name: p.name, damage: p.totalDamage }));
  const typeDamage = flattenMoveTypes(filteredRows).slice(0, 12);

  const uploadJson = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      normalizeStats(parsed);
      setStats(parsed);
      setMode('overall');
      setError('');
    } catch (e) {
      setError(`Could not parse stats file: ${e.message}`);
    }
  };

  const metricCards = [
    { label: 'Pokemon', value: kpis.pokemonCount, detail: `${kpis.totalBattles.toLocaleString()} total battles`, tone: '#74c0fc' },
    { label: 'Most Wins', value: kpis.mostWins?.wins ?? 0, detail: kpis.mostWins?.name ?? '-', tone: '#f2c94c', pokemon: kpis.mostWins },
    { label: 'Most KOs', value: kpis.mostKos?.kos ?? 0, detail: kpis.mostKos?.name ?? '-', tone: '#ff6b6b', pokemon: kpis.mostKos },
    { label: 'Top Damage', value: formatInt(kpis.topDamage?.totalDamage ?? 0), detail: kpis.topDamage?.name ?? '-', tone: '#69db7c', pokemon: kpis.topDamage },
  ];

  const columns = [
    {
      field: 'name',
      headerName: 'Pokemon',
      minWidth: 240,
      flex: 1,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1.1} sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', width: 28 }}>
            {row.rank}
          </Typography>
          <PokemonSprite name={row.name} />
          <Typography noWrap fontWeight={800}>{row.name}</Typography>
        </Stack>
      ),
    },
    { field: 'battles', headerName: 'Battles', width: 104, renderCell: ({ value }) => <StatPill tone="blue" value={value} /> },
    { field: 'wins', headerName: 'Wins', width: 92, renderCell: ({ value }) => <StatPill tone="gold" value={value} /> },
    { field: 'winRate', headerName: 'Win %', width: 100, renderCell: ({ value }) => <StatPill tone={value >= 50 ? 'green' : 'default'} value={formatPercent(value)} /> },
    { field: 'kos', headerName: 'KOs', width: 86, renderCell: ({ value }) => <StatPill tone="red" value={value} /> },
    { field: 'avgKos', headerName: 'KOs/B', width: 96, renderCell: ({ value }) => <StatPill tone="orange" value={formatTwoDecimals(value)} /> },
    { field: 'totalDamage', headerName: 'Damage', width: 120, renderCell: ({ value }) => <StatPill tone="green" value={formatInt(value)} /> },
    { field: 'avgDamage', headerName: 'Avg Dmg', width: 112, renderCell: ({ value }) => <StatPill tone="blue" value={formatOneDecimal(value)} /> },
    { field: 'damageRatio', headerName: 'Ratio', width: 96, renderCell: ({ value }) => <StatPill tone={value >= 1 ? 'green' : 'default'} value={formatTwoDecimals(value)} /> },
    { field: 'hits', headerName: 'Hits', width: 86, renderCell: ({ value }) => <StatPill value={value} /> },
    { field: 'bestHit', headerName: 'Best Hit', width: 104, renderCell: ({ value }) => <StatPill tone="pink" value={value ? formatInt(value) : '-'} /> },
    { field: 'finishes', headerName: 'Finishes', width: 104, renderCell: ({ value }) => <StatPill tone="pink" value={value} /> },
    { field: 'deaths', headerName: 'Deaths', width: 96, renderCell: ({ value }) => <StatPill tone="red" value={value} /> },
    { field: 'survivalRate', headerName: 'Survival', width: 108, renderCell: ({ value }) => <StatPill tone={value >= 50 ? 'green' : 'default'} value={formatPercent(value)} /> },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, rgba(116, 192, 252, 0.10), transparent 34%), linear-gradient(225deg, rgba(247, 131, 172, 0.09), transparent 38%), #101217',
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1460, py: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={2}>
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
                Export v{normalizedStats.version ?? 'unknown'} loaded. Showing {mode === 'overall' ? 'overall lifetime' : mode.toUpperCase()} performance from {normalizedStats.overall.length.toLocaleString()} Pokemon records.
              </Typography>
            </Box>
            <Button component="label" variant="contained" startIcon={<UploadFileIcon />} sx={{ alignSelf: { xs: 'flex-start', md: 'auto' }, textTransform: 'none' }}>
              Upload stats JSON
              <input hidden type="file" accept="application/json" onChange={uploadJson} />
            </Button>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_, value) => value && setMode(value)}
            sx={{
              flexWrap: 'wrap',
              gap: 0.75,
              '& .MuiToggleButton-root': {
                border: '1px solid #30384b !important',
                borderRadius: '8px !important',
                color: '#9ca8ba',
                minHeight: 36,
                px: 1.5,
                textTransform: 'none',
              },
              '& .Mui-selected': {
                bgcolor: '#263048 !important',
                color: '#eef2f8 !important',
              },
            }}
          >
            {availableModes.map((item) => (
              <ToggleButton key={item} value={item}>{item === 'overall' ? 'Overall' : item.toUpperCase()}</ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Grid container spacing={1.5}>
            {metricCards.map((card) => (
              <Grid key={card.label} size={{ xs: 6, lg: 3 }}>
                <Card>
                  <CardContent sx={{ alignItems: 'center', display: 'flex', gap: 1.5, minHeight: 100 }}>
                    {card.pokemon && <PokemonSprite name={card.pokemon.name} size={42} />}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography color="text.secondary" fontSize={12} fontWeight={800} textTransform="uppercase">{card.label}</Typography>
                      <Typography sx={{ color: card.tone, fontSize: 30, fontWeight: 850, lineHeight: 1, mt: 0.75 }}>{card.value}</Typography>
                      <Typography noWrap color="text.secondary" fontSize={13} sx={{ mt: 0.75 }}>{card.detail}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

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
                {normalizedStats.modes.map((item) => (
                  <Chip
                    key={item.mode}
                    label={`${item.mode}: ${item.battles.toLocaleString()} battles | ${formatInt(item.damage)} dmg | ${formatPercent(pct(item.wins, item.battles))}`}
                    sx={{ bgcolor: 'rgba(37,45,62,0.78)', color: '#dde6f5', height: 38 }}
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ height: 390 }}>
                <CardContent sx={{ height: '100%' }}>
                  <Typography variant="h6" fontWeight={850} gutterBottom>Top Damage</Typography>
                  <ResponsiveContainer width="100%" height="88%">
                    <BarChart data={damageByPokemon} layout="vertical" margin={{ left: 28, right: 24, top: 8, bottom: 8 }}>
                      <CartesianGrid stroke="rgba(74,85,111,0.42)" horizontal={false} />
                      <XAxis type="number" stroke="#9ca8ba" />
                      <YAxis dataKey="name" type="category" width={98} stroke="#c8d2e4" />
                      <Tooltip cursor={{ fill: 'rgba(116,192,252,0.08)' }} formatter={(value) => formatOneDecimal(value)} />
                      <Bar dataKey="damage" fill="#74c0fc" radius={[0, 4, 4, 0]} />
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
                      <Tooltip formatter={(value) => formatOneDecimal(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2} sx={{ mb: 1.5 }}>
                <Typography variant="h6" fontWeight={850}>Leaderboard</Typography>
                <Typography color="text.secondary" fontSize={13}>{filteredRows.length.toLocaleString()} visible Pokemon</Typography>
              </Stack>
              <Box sx={{ height: 610 }}>
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  disableRowSelectionOnClick
                  initialState={{
                    sorting: { sortModel: [{ field: 'wins', sort: 'desc' }] },
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                  pageSizeOptions={[25, 50, 100]}
                  rowHeight={54}
                  sx={{
                    border: '1px solid #30384b',
                    '& .MuiDataGrid-columnHeaders': { bgcolor: '#202636', color: '#c8d2e4' },
                    '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: '#151a22' },
                    '& .MuiDataGrid-row:hover': { bgcolor: '#222b3b' },
                    '& .MuiDataGrid-cell': { borderColor: 'rgba(48,56,75,0.78)' },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
