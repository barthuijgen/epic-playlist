import { useState, useEffect } from 'react';
import './App.css';
import SagaSection from './components/SagaSection';
import PlaylistPlayer from './components/PlaylistPlayer';

function App() {
  const [songsData, setSongsData] = useState([]);
  const [selections, setSelections] = useState({});
  const [isPlayerMode, setIsPlayerMode] = useState(false);
  const [playlistVideos, setPlaylistVideos] = useState([]);

  useEffect(() => {
    // Check URL for playlist parameters
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p) {
      setPlaylistVideos(p.split(','));
      setIsPlayerMode(true);
    }

    // Load static JSON data
    fetch('/src/data/songs.json')
      .then(res => res.json())
      .then(data => setSongsData(data))
      .catch(err => console.error("Error loading songs data:", err));
  }, []);

  const handleSelectVideo = (songId, videoId) => {
    setSelections(prev => ({
      ...prev,
      [songId]: videoId
    }));
  };

  const generatePlaylist = () => {
    // Generate a comma-separated list of selected video IDs
    const vids = songsData.map(song => {
      // Use selected video or default to the first one if available
      return selections[song.id] || (song.videos && song.videos.length > 0 ? song.videos[0].videoId : null);
    }).filter(v => v !== null);

    if (vids.length === 0) {
      alert("No videos selected!");
      return;
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?p=${vids.join(',')}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Playlist link copied to clipboard!");
      window.location.href = shareUrl;
    });
  };

  if (isPlayerMode) {
    return <PlaylistPlayer videos={playlistVideos} />;
  }

  // Group songs by saga
  const sagas = songsData.reduce((acc, song) => {
    if (!acc[song.saga]) acc[song.saga] = [];
    acc[song.saga].push(song);
    return acc;
  }, {});

  return (
    <div className="app-container">
      <header className="app-header glass">
        <h1 className="text-glow text-accent">Epic The Musical</h1>
        <p className="subtitle">Custom Animated Playlist Generator</p>
      </header>

      <main className="main-content">
        {Object.entries(sagas).map(([sagaName, songs]) => (
          <SagaSection 
            key={sagaName} 
            sagaName={sagaName} 
            songs={songs} 
            selections={selections}
            onSelectVideo={handleSelectVideo}
          />
        ))}

        {songsData.length > 0 && (
          <div className="generate-section">
            <button className="btn-generate glass glow-hover" onClick={generatePlaylist}>
              Generate & Share Playlist
            </button>
          </div>
        )}
        
        {songsData.length === 0 && (
          <div className="loading">Loading songs...</div>
        )}
      </main>
    </div>
  );
}

export default App;
