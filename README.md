# Pokébattler Stats Viewer

A polished React + MUI frontend for visualizing Pokémon autobattler stats exported from a Python/Pygame game.

## Features

- Upload local JSON stats files.
- KPI cards for win rate, damage, DPS, KOs, deaths, and status damage.
- Charts for:
  - Total damage per Pokémon
  - Damage by move type
- Mode summary chips for `2v2`, `3v3`, `Royale`, `Tournament`, and `Boss` (or any mode in your data).
- Sort/filter-friendly Pokémon stats table.

## Expected JSON shape

```json
{
  "battles": [
    { "id": 1, "mode": "2v2", "winner": true, "damage": 1230, "dps": 54, "kos": 2, "deaths": 1 }
  ],
  "pokemon": [
    {
      "name": "Pikachu",
      "totalDamage": 2190,
      "avgDps": 61,
      "kos": 4,
      "avgKos": 0.8,
      "deaths": 3,
      "avgDeaths": 0.6,
      "wins": 3,
      "battles": 5,
      "moveTypes": { "electric": 1700, "normal": 490 },
      "statusDamage": 160
    }
  ]
}
```

## Run locally

```bash
npm install
npm run dev
```

## Next steps

- Add filters by battle mode, Pokémon type, and date range.
- Add trend charts if you include timestamps per battle.
- Add CSV export and shareable report snapshots.
