# Epic Playlist - Project Documentation

## Project Overview
**Epic Playlist** is a web-based, custom animated playlist generator and viewer for *Epic The Musical*. It allows users to browse different YouTube animations for each song in the musical, organize them by saga, filter by specific animators (authors), and generate a continuous playable custom playlist. 

The application is heavily client-side, relying on a pre-compiled JSON catalog of videos and maintaining state via URL parameters to enable easy sharing of custom playlists.

## Technical Stack
- **Framework & Build Tool:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Vanilla CSS (`index.css`, `App.css`) leveraging modern web design aesthetics like glassmorphism (`.glass`), neon text glow (`.text-glow`), and curated color palettes.
- **Video Player:** `react-youtube` for embedding and controlling YouTube playback.
- **Package Manager:** `pnpm` (`pnpm-workspace.yaml` is used for pnpm configuration; this is *not* a monorepo).
- **Deployment:** Cloudflare Workers (configured via `wrangler.jsonc` and the `@cloudflare/vite-plugin`).
- **Linting & Formatting:** `oxlint` and `oxfmt`.
- **Data Scraping/Management:** Python scripts (`scripts/fetch_data.py`, `scripts/clean_data.py`, `scripts/update_metadata.py`) to fetch, clean, and update YouTube metadata. These are run manually to manage YouTube API limits (no CI/CD automation planned).

## Architecture & Structure
The codebase follows a standard React/Vite structure, mostly contained within the `src/` directory.

### Directory Breakdown:
- `src/components/`: Contains UI building blocks:
  - `AuthorSection.tsx`: Allows users to filter animations by specific authors.
  - `SagaSection.tsx`: Groups songs by their respective saga.
  - `SongPicker.tsx`: Component to pick specific video versions for a song.
  - `PlaylistPlayer.tsx`: The actual YouTube player interface that takes a list of video IDs and plays them continuously.
  - `StickyActionBar.tsx`: A persistent bar tracking user selections, giving quick access to "Play Now" or generating a shareable URL.
  - `FillGapsToggle.tsx`: A feature allowing users to fill out their playlist with popular videos if a selected author hasn't covered certain songs.
- `src/data/`:
  - `songs.json`: The core database acting as the single source of truth for the frontend catalog.
  - `blacklist.json`: Stores video IDs that were once loaded but flagged as false positives. Used by the Python fetch script's AI filter to ignore them on future runs.
- `scripts/`: Python scripts for automating the catalog data generation.

### Key UX Flows
1. **Catalog Browsing:**
   - The user loads the homepage and is presented with songs grouped by their "Saga".
   - By default, songs are populated with the most viewed animations.
2. **Author Filtering & Selection:**
   - The user can select a top animator from the `AuthorSection`.
   - The app prioritizes videos from the selected author.
   - The user can toggle `FillGapsToggle` to determine whether missing songs in that author's catalog should be filled by other animators or left out.
3. **Customization:**
   - Users can manually override the selected animation for any song via the `SongPicker`.
4. **Playback & Sharing:**
   - Selections update the `StickyActionBar` shareable URL (`?p=vid1,vid2,...`).
   - Pressing "Play Now" activates `isPlayerMode`, replacing the main UI with `PlaylistPlayer` to sequentially play the chosen videos.
   - Anyone opening the shareable URL skips the builder and goes straight into `isPlayerMode`.

## Design Philosophy
- **Rich Aesthetics:** The UI uses glassmorphic elements, gradients, and vibrant colors (especially in headers) to feel responsive, dynamic, and premium.
- **Client-First State Management:** Playlists are encoded directly into URL parameters (`?p=...`). Since the playlist caps around 40 songs, URL length is currently manageable. However, future features (like "sync play") might introduce a backend database.

## Agent Instructions (Rules for Development)
- **Maintain Aesthetics:** Do not use generic colors. Stick to the defined design system (`index.css`) which emphasizes high-quality UI/UX. Use micro-animations and hover effects for interactivity.
- **Stateless Playlists:** When adding new playlist functionality, remember that it must be serializable to the URL to preserve the shareable nature of the app.
- **Keep Data Synchronized:** Changes to the song schema in TypeScript (`src/types.ts`) may require corresponding updates to the Python data fetchers in `scripts/`.
- **TypeScript & Formatting:** Ensure any new code conforms to the strict `oxlint` rules and TypeScript checks (`pnpm typecheck`).
