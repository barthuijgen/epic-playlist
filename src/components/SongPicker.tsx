import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Song } from '../types';
import YouTube from 'react-youtube';

interface SongPickerProps {
  song: Song;
  selectedVideoId: string | null;
  onSelect: (videoId: string) => void;
  favorites: string[];
  toggleFavorite: (videoId: string) => void;
}

const SongPicker: React.FC<SongPickerProps> = ({ song, selectedVideoId, onSelect, favorites, toggleFavorite }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);
  
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // When selected video changes (e.g. via outside selection), stop preview
  useEffect(() => {
    setIsPreviewing(false);
  }, [selectedVideoId]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    if (Math.abs(walk) > 5) setDragMoved(true);
  };

  const handleVideoClick = (videoId: string) => {
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

  if (!song.videos || song.videos.length === 0) {
    return (
      <div className="song-picker">
        <h3 className="song-title">{song.title}</h3>
        <div className="no-videos-message">No videos found for this song yet.</div>
      </div>
    );
  }

  // Determine Hero Video
  let heroVideo = song.videos.find(v => v.videoId === selectedVideoId);
  if (!heroVideo) heroVideo = song.videos[0]; // Fallback to first if none selected
  if (!heroVideo) return null;

  // Keep hero video in gallery but style it differently
  const galleryVideos = song.videos;
  const hasMore = galleryVideos.length > 10;

  return (
    <div className="song-picker">
      <div className="song-header">
        <div className="song-info" style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem', margin: 0 }}>
          <h3 className="song-title" style={{ margin: 0 }}>{song.title}</h3>
          <span className="video-count">({song.videos.length} videos)</span>
        </div>
        {hasMore && (
          <button className="btn-view-all" onClick={() => setIsModalOpen(true)}>
            View All ({song.videos.length})
          </button>
        )}
      </div>

      <div className="song-layout">
        {/* HERO SECTION */}
        <div className="hero-section">
          <div className="hero-video-wrapper">
            {isPreviewing ? (
              <YouTube
                videoId={heroVideo.videoId}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: { autoplay: 1, modestbranding: 1, rel: 0 }
                }}
                className="youtube-iframe-hero"
              />
            ) : (
              <div className="hero-thumbnail-container" onClick={() => setIsPreviewing(true)}>
                <img 
                  src={`https://img.youtube.com/vi/${heroVideo.videoId}/maxresdefault.jpg`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://img.youtube.com/vi/${heroVideo.videoId}/hqdefault.jpg`;
                  }}
                  alt={heroVideo.title}
                  className="hero-thumbnail"
                  loading="lazy"
                />
                <div className="hero-play-overlay glow-hover">
                  <div className="play-icon">▶ Preview</div>
                </div>
              </div>
            )}
            {!isPreviewing && <div className="selected-badge hero-badge">Selected</div>}
          </div>
          <div className="hero-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 className="hero-title" title={heroVideo.title}>{heroVideo.title}</h4>
              <button 
                className={`btn-favorite ${favorites.includes(heroVideo.videoId) ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleFavorite(heroVideo!.videoId); }}
                title={favorites.includes(heroVideo.videoId) ? "Remove from Favorites" : "Add to Favorites"}
              >
                {favorites.includes(heroVideo.videoId) ? '★' : '☆'}
              </button>
            </div>
            <div className="hero-meta">
              {heroVideo.author && <span className="author">{heroVideo.author}</span>}
              {heroVideo.views !== undefined && <span className="views">{formatViews(heroVideo.views)}</span>}
            </div>
          </div>
        </div>

        {/* GALLERY SECTION */}
        {galleryVideos.length > 0 && (
          <div className="gallery-section">
            <div 
              className={`video-options-container gallery-container ${isDragging ? 'dragging' : ''}`}
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              {galleryVideos.map((video) => {
                const isSelected = heroVideo!.videoId === video.videoId;
                return (
                <div 
                  key={video.videoId} 
                  className={`video-thumbnail gallery-item ${isSelected ? 'gallery-item-selected' : ''}`}
                  onClick={() => {
                    if (!isSelected) handleVideoClick(video.videoId);
                  }}
                >
                  <div className="thumbnail-img-wrapper">
                    <img 
                      src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
                      alt={video.title} 
                      className="thumbnail-img"
                      loading="lazy"
                      draggable="false"
                    />
                    {favorites.includes(video.videoId) && (
                      <span className="favorite-badge">★</span>
                    )}
                  </div>
                  <div className="thumbnail-details">
                    <div className="thumbnail-title" title={video.title}>{video.title}</div>
                    <div className="thumbnail-meta">
                      {video.author && <span className="author">{video.author}</span>}
                      {video.views !== undefined && <span className="views">{formatViews(video.views)}</span>}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </div>

      {/* VIEW ALL MODAL (Portaled to body to prevent stacking context issues) */}
      {isModalOpen && createPortal(
        <div className="video-grid-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="video-grid-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header glass">
              <h3>All Variations: {song.title}</h3>
              <button className="btn-close glow-hover" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-grid-content">
              <div className="modal-grid">
                {song.videos.map(video => {
                  const isSelected = selectedVideoId === video.videoId;
                  return (
                    <div 
                      key={video.videoId} 
                      className={`video-thumbnail grid-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        onSelect(video.videoId);
                        setIsModalOpen(false);
                      }}
                    >
                      <div className="thumbnail-img-wrapper">
                        <img 
                          src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
                          alt={video.title} 
                          className="thumbnail-img"
                          loading="lazy"
                        />
                        {isSelected && <span className="selected-badge">Selected</span>}
                        {favorites.includes(video.videoId) && (
                          <span className="favorite-badge">★</span>
                        )}
                      </div>
                      <div className="thumbnail-details">
                        <div className="thumbnail-title" title={video.title}>{video.title}</div>
                        <div className="thumbnail-meta">
                          {video.author && <span className="author">{video.author}</span>}
                          {video.views !== undefined && <span className="views">{formatViews(video.views)}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SongPicker;
