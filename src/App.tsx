import { useState, useEffect, useMemo } from "react";
import "./App.css";
import SagaSection from "./components/SagaSection";
import PlaylistPlayer from "./components/PlaylistPlayer";
import StickyActionBar from "./components/StickyActionBar";
import AuthorSection from "./components/AuthorSection";
import FillGapsToggle from "./components/FillGapsToggle";
import { Song, Selections, AuthorStat } from "./types";
import songsJsonRaw from "./data/songs.json";

function App() {
  const [selections, setSelections] = useState<Selections>({});
  const [isPlayerMode, setIsPlayerMode] = useState<boolean>(false);
  const [playlistVideos, setPlaylistVideos] = useState<string[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [fillGaps, setFillGaps] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('epic_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (videoId: string) => {
    setFavorites(prev => {
      const newFavs = prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId];
      localStorage.setItem('epic_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  // 1. Initial sorting of videos by views
  const songsData = useMemo(() => {
    const data = JSON.parse(JSON.stringify(songsJsonRaw)) as Song[];
    data.forEach(song => {
      if (song.videos) {
        song.videos.sort((a, b) => (b.views || 0) - (a.views || 0));
      }
    });
    return data;
  }, []);

  // 2. Aggregate author statistics
  const authorsStats = useMemo(() => {
    const stats: Record<string, { totalVideos: number, songsCovered: Set<string>, totalViews: number }> = {};

    songsData.forEach(song => {
      if (!song.videos) return;
      song.videos.forEach(video => {
        if (!video.author) return;
        
        if (!stats[video.author]) {
          stats[video.author] = { totalVideos: 0, songsCovered: new Set(), totalViews: 0 };
        }
        
        stats[video.author]!.totalVideos += 1;
        stats[video.author]!.songsCovered.add(song.id);
        stats[video.author]!.totalViews += (video.views || 0);
      });
    });

    const authorsList: AuthorStat[] = Object.entries(stats).map(([name, data]) => ({
      name,
      totalVideos: data.totalVideos,
      songsCovered: data.songsCovered.size,
      totalViews: data.totalViews
    }));

    // Sort by total views descending
    return authorsList.sort((a, b) => b.totalViews - a.totalViews);
  }, [songsData]);

  // 3. Filter songs based on selected author and sort by favorites
  const filteredSongsData = useMemo(() => {
    return songsData.map(song => {
      if (!song.videos) return null;
      
      const hasAuthorVideo = selectedAuthor ? song.videos.some(v => v.author === selectedAuthor) : false;
      
      // If strict mode and no video by author, hide the song entirely
      if (selectedAuthor && !hasAuthorVideo && !fillGaps) {
        return null;
      }
      
      // If strict mode, only show videos by the selected author
      let filteredVideos = song.videos;
      if (selectedAuthor && !fillGaps) {
        filteredVideos = filteredVideos.filter(v => v.author === selectedAuthor);
      }
      
      // Sort: Selected author first, then favorites, then views
      const sortedVideos = [...filteredVideos].sort((a, b) => {
        if (selectedAuthor) {
          const aIsAuthor = a.author === selectedAuthor ? 1 : 0;
          const bIsAuthor = b.author === selectedAuthor ? 1 : 0;
          if (aIsAuthor !== bIsAuthor) return bIsAuthor - aIsAuthor;
        }

        const aIsFav = favorites.includes(a.videoId) ? 1 : 0;
        const bIsFav = favorites.includes(b.videoId) ? 1 : 0;
        if (aIsFav !== bIsFav) return bIsFav - aIsFav;

        return (b.views || 0) - (a.views || 0);
      });

      return { ...song, videos: sortedVideos };
    }).filter((song): song is Song => song !== null);
  }, [songsData, selectedAuthor, fillGaps, favorites]);

  const totalCatalogVideos = useMemo(() => {
    return songsData.reduce((sum, song) => sum + (song.videos?.length || 0), 0);
  }, [songsData]);


  useEffect(() => {
    // Check URL for playlist parameters
    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    if (p) {
      setPlaylistVideos(p.split(","));
      setIsPlayerMode(true);
    }
  }, []);

  const handleSelectVideo = (songId: string, videoId: string) => {
    setSelections((prev) => ({
      ...prev,
      [songId]: videoId,
    }));
  };

  const vids = useMemo(() => {
    return filteredSongsData
      .map((song) => {
        return selections[song.id] || (song.videos && song.videos.length > 0 ? (song.videos[0]?.videoId ?? null) : null);
      })
      .filter((v): v is string => v !== null && v !== undefined);
  }, [filteredSongsData, selections]);

  const shareUrl = useMemo(() => {
    if (vids.length === 0) return "";
    return `${window.location.origin}${window.location.pathname}?p=${vids.join(",")}`;
  }, [vids]);

  const handlePlayNow = () => {
    if (vids.length === 0) {
      alert("No videos selected!");
      return;
    }
    // Update URL and enter player mode
    window.history.pushState({}, '', shareUrl);
    setPlaylistVideos(vids);
    setIsPlayerMode(true);
  };

  if (isPlayerMode) {
    return <PlaylistPlayer videos={playlistVideos} />;
  }

  // Group songs by saga
  const sagas = filteredSongsData.reduce((acc: Record<string, Song[]>, song) => {
    if (!acc[song.saga]) acc[song.saga] = [];
    acc[song.saga]!.push(song);
    return acc;
  }, {});

  return (
    <div className="app-container pb-32">
      <header className="app-header glass">
        <h1 className="text-glow text-accent">Epic The Musical</h1>
        <p className="subtitle">Custom Animated Playlist Generator</p>
        <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', opacity: 0.8 }}>
          {totalCatalogVideos} Total Videos in Catalog
        </p>
      </header>

      <main className="main-content">
        
        <AuthorSection 
          authors={authorsStats.slice(0, 50)} // Show top 50 authors
          selectedAuthor={selectedAuthor}
          onSelectAuthor={setSelectedAuthor}
        />

        {selectedAuthor && (
          <FillGapsToggle 
            fillGaps={fillGaps}
            onToggle={setFillGaps}
            selectedAuthor={selectedAuthor}
          />
        )}

        {Object.entries(sagas).map(([sagaName, songs]) => (
          <SagaSection
            key={sagaName}
            sagaName={sagaName}
            songs={songs}
            selections={selections}
            onSelectVideo={handleSelectVideo}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        ))}

        {filteredSongsData.length === 0 && <div className="loading">No songs found matching criteria.</div>}
      </main>

      <StickyActionBar 
        shareUrl={shareUrl} 
        onPlayNow={handlePlayNow} 
        isEnabled={vids.length > 0} 
      />
    </div>
  );
}

export default App;
