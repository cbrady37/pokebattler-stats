# Pokebattler Stats Viewer

A React + MUI frontend for visualizing Pokemon autobattler stats exported from the Python/Pygame game.

## Features

- Loads the local `pokemon_stats.json` export by default.
- Uploads alternate JSON stats files.
- KPI cards for Pokemon count, appearances, win rate, damage, hits, KOs, and deaths.
- Charts for top damage by Pokemon and damage by move type.
- Mode summary chips for `2v2`, `3v3`, `royale`, `tournament`, `boss`, or any mode in your data.
- Sort/filter-friendly Pokemon stats table.

## Expected JSON Shape

The viewer supports the current export format:

```json
{
  "version": 2,
  "overall": {
    "Pikachu": {
      "battles": 5,
      "wins": 3,
      "kos": 4,
      "deaths": 2,
      "finishes": 1,
      "damage_dealt": 2190,
      "damage_taken": 1200,
      "hits": 30,
      "best_hit": 180,
      "damage_by_type": { "electric": 1700, "normal": 490 }
    }
  },
  "by_mode": {
    "royale": {
      "Pikachu": {
        "battles": 2,
        "wins": 1,
        "kos": 2,
        "deaths": 1,
        "finishes": 1
      }
    }
  }
}
```

The older demo shape with top-level `pokemon` and `battles` arrays is still accepted for uploads.

## Run Locally

```bash
npm install
npm run dev
```
