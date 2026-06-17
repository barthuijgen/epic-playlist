import React, { useState } from 'react';
import YouTube, { YouTubeEvent } from 'react-youtube';

interface PlaylistPlayerProps {
  videos: string[];
}

const PlaylistPlayer: React.FC<PlaylistPlayerProps> = ({ videos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!videos || videos.length === 0) {
    return <div className="player-container"><div className="player-header">No videos in playlist</div></div>;
  }

  const currentVideoId = videos[currentIndex];

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleEnd = (event: YouTubeEvent) => {
    // When video ends, automatically go to next if not at the end
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="player-container animate-fade-in">
      <header className="player-header">
        <div className="player-title-area">
          <h2 className="text-glow text-primary" style={{ margin: 0 }}>Epic Custom Playlist</h2>
          <span className="playlist-counter">Track {currentIndex + 1} of {videos.length}</span>
        </div>
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
      
      <div className="player-content">
        <button 
          className="nav-btn prev-btn" 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          title="Previous Track"
        >
          &lt;
        </button>

        <div className="youtube-wrapper">
          <YouTube
            videoId={currentVideoId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                rel: 0,
                modestbranding: 1
              },
            }}
            onEnd={handleEnd}
            className="youtube-iframe"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        <button 
          className="nav-btn next-btn" 
          onClick={handleNext} 
          disabled={currentIndex === videos.length - 1}
          title="Next Track"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default PlaylistPlayer;
