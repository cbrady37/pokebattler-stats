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
  Stack,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { sampleStats } from './sampleData';

const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

const flattenMoveTypes = (pokemon) => {
  const rollup = {};
  pokemon.forEach((p) => {
    Object.entries(p.moveTypes ?? {}).forEach(([type, value]) => {
      rollup[type] = (rollup[type] ?? 0) + value;
    });
  });
  return Object.entries(rollup).map(([name, value]) => ({ name, value }));
};

function App() {
  const [stats, setStats] = useState(sampleStats);
  const [error, setError] = useState('');

  const uploadJson = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed?.pokemon || !parsed?.battles) throw new Error('Missing `pokemon` or `battles`.');
      setStats(parsed);
      setError('');
    } catch (e) {
      setError(`Could not parse stats file: ${e.message}`);
    }
  };

  const kpis = useMemo(() => {
    const battles = stats.battles ?? [];
    const pokemon = stats.pokemon ?? [];
    const wins = battles.filter((b) => b.winner).length;
    return {
      totalBattles: battles.length,
      winRate: battles.length ? (wins / battles.length) * 100 : 0,
      totalDamage: pokemon.reduce((sum, p) => sum + (p.totalDamage ?? 0), 0),
      avgDps: avg(pokemon.map((p) => p.avgDps ?? 0)),
      avgKos: avg(pokemon.map((p) => p.avgKos ?? 0)),
      avgDeaths: avg(pokemon.map((p) => p.avgDeaths ?? 0)),
      totalStatusDamage: pokemon.reduce((sum, p) => sum + (p.statusDamage ?? 0), 0),
    };
  }, [stats]);

  const damageByPokemon = (stats.pokemon ?? []).map((p) => ({ name: p.name, damage: p.totalDamage ?? 0 }));
  const battleModeDamage = Object.values(
    (stats.battles ?? []).reduce((acc, b) => {
      const mode = b.mode ?? 'Unknown';
      acc[mode] ??= { mode, damage: 0, dps: [] };
      acc[mode].damage += b.damage ?? 0;
      acc[mode].dps.push(b.dps ?? 0);
      return acc;
    }, {}),
  ).map((x) => ({ mode: x.mode, damage: x.damage, avgDps: avg(x.dps) }));

  const rows = (stats.pokemon ?? []).map((p, idx) => ({
    id: idx + 1,
    name: p.name,
    totalDamage: p.totalDamage ?? 0,
    avgDps: p.avgDps ?? 0,
    statusDamage: p.statusDamage ?? 0,
    kos: p.kos ?? 0,
    avgKos: p.avgKos ?? 0,
    deaths: p.deaths ?? 0,
    avgDeaths: p.avgDeaths ?? 0,
    wins: p.wins ?? 0,
    winRate: p.battles ? ((p.wins ?? 0) / p.battles) * 100 : 0,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h3" fontWeight={700}>Pokébattler Stats Viewer</Typography>
            <Typography color="text.secondary">Upload JSON logs from your Python/Pygame autobattler and instantly analyze performance.</Typography>
          </Box>
          <Button component="label" variant="contained" startIcon={<UploadFileIcon />}>
            Upload stats JSON
            <input hidden type="file" accept="application/json" onChange={uploadJson} />
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Grid container spacing={2}>
          {[
            ['Battles', kpis.totalBattles],
            ['Win Rate', `${kpis.winRate.toFixed(1)}%`],
            ['Total Damage', kpis.totalDamage.toLocaleString()],
            ['Avg DPS', kpis.avgDps.toFixed(1)],
            ['Avg KOs', kpis.avgKos.toFixed(2)],
            ['Avg Deaths', kpis.avgDeaths.toFixed(2)],
            ['Status Damage', kpis.totalStatusDamage.toLocaleString()],
          ].map(([label, value]) => (
            <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h5">{value}</Typography></CardContent></Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: 380 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom>Total Damage by Pokémon</Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={damageByPokemon}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="damage" fill="#66bb6a" /></BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: 380 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom>Damage by Move Type</Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={flattenMoveTypes(stats.pokemon ?? [])} dataKey="value" nameKey="name" outerRadius={110} fill="#42a5f5" label />
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Mode Performance</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {battleModeDamage.map((mode) => (
                <Chip key={mode.mode} label={`${mode.mode}: ${mode.damage.toLocaleString()} dmg | ${mode.avgDps.toFixed(1)} DPS`} />
              ))}
            </Stack>
            <Box sx={{ height: 420 }}>
              <DataGrid
                rows={rows}
                columns={[
                  { field: 'name', headerName: 'Pokémon', flex: 1, minWidth: 140 },
                  { field: 'totalDamage', headerName: 'Total Damage', width: 140 },
                  { field: 'avgDps', headerName: 'Avg DPS', width: 110 },
                  { field: 'statusDamage', headerName: 'Status Damage', width: 130 },
                  { field: 'kos', headerName: 'KOs', width: 90 },
                  { field: 'avgKos', headerName: 'Avg KOs', width: 100 },
                  { field: 'deaths', headerName: 'Deaths', width: 100 },
                  { field: 'avgDeaths', headerName: 'Avg Deaths', width: 120 },
                  { field: 'wins', headerName: 'Wins', width: 90 },
                  {
                    field: 'winRate',
                    headerName: 'Winrate %',
                    width: 110,
                    valueFormatter: (value) => Number(value).toFixed(1),
                  },
                ]}
                disableRowSelectionOnClick
              />
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

export default App;
