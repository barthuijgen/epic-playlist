import React from 'react';

const PlaylistPlayer = ({ videos }) => {
  // Construct the playlist URL
  // YouTube embed format: https://www.youtube.com/embed/VIDEO_ID?playlist=VIDEO_ID1,VIDEO_ID2...
  
  if (!videos || videos.length === 0) {
    return <div className="player-container"><div className="player-header">No videos in playlist</div></div>;
  }

  const firstVideo = videos[0];
  const remainingVideos = videos.slice(1).join(',');
  const playlistParam = remainingVideos ? `&playlist=${remainingVideos}` : '';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${firstVideo}?autoplay=1${playlistParam}`;

  return (
    <div className="player-container animate-fade-in">
      <header className="player-header">
        <h2 className="text-glow text-primary" style={{ margin: 0 }}>Epic Custom Playlist</h2>
        <button 
          className="btn-back" 
          onClick={() => {
            // Remove ?p=... from URL to go back to selection mode
            window.history.pushState({}, '', window.location.pathname);
            window.location.reload();
          }}
        >
          Back to Selection
        </button>
      </header>
      <div className="youtube-wrapper">
        <iframe 
          className="youtube-iframe"
          src={embedUrl} 
          title="Epic The Musical Playlist" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default PlaylistPlayer;
