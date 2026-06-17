import React, { useRef, useState } from 'react';
import { Song } from '../types';

interface SongPickerProps {
  song: Song;
  selectedVideoId: string | null;
  onSelect: (videoId: string) => void;
}

const SongPicker: React.FC<SongPickerProps> = ({ song, selectedVideoId, onSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    
    // If they moved the mouse significantly, register it as a drag so we don't trigger click
    if (Math.abs(walk) > 5) {
      setDragMoved(true);
    }
  };

  const handleVideoClick = (videoId: string) => {
    // Only select if it was a genuine click, not the end of a drag
    if (!dragMoved) {
      onSelect(videoId);
    }
  };

  const formatViews = (views?: number) => {
    if (views === undefined) return '';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  return (
    <div className="song-picker">
      <div className="song-info" style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem' }}>
        <h3 className="song-title">{song.title}</h3>
        {song.videos && song.videos.length > 0 && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            ({song.videos.length} videos)
          </span>
        )}
      </div>
      
      {song.videos && song.videos.length > 0 ? (
        <div 
          className={`video-options-container ${isDragging ? 'dragging' : ''}`}
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {song.videos.map((video) => {
            const isSelected = selectedVideoId === video.videoId;
            return (
              <div 
                key={video.videoId} 
                className={`video-thumbnail ${isSelected ? 'selected' : ''}`}
                onClick={() => handleVideoClick(video.videoId)}
              >
                <div className="thumbnail-img-wrapper">
                  <img 
                    src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
                    alt={video.title} 
                    className="thumbnail-img"
                    loading="lazy"
                    draggable="false"
                  />
                  {isSelected && <span className="selected-badge">Selected</span>}
                </div>
                <div className="thumbnail-details">
                  <div className="thumbnail-title" title={video.title}>
                    {video.title}
                  </div>
                  {(video.author || video.views !== undefined) && (
                    <div className="thumbnail-meta">
                      {video.author && <span className="author">{video.author}</span>}
                      {video.views !== undefined && <span className="views">{formatViews(video.views)}</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-videos-message">No videos found for this song yet.</div>
      )}
    </div>
  );
};

export default SongPicker;
