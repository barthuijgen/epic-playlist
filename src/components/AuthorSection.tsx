import React, { useRef, useState } from 'react';
import { AuthorStat } from '../types';

interface AuthorSectionProps {
  authors: AuthorStat[];
  selectedAuthor: string | null;
  onSelectAuthor: (authorName: string | null) => void;
}

const AuthorSection: React.FC<AuthorSectionProps> = ({ authors, selectedAuthor, onSelectAuthor }) => {
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
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    
    if (Math.abs(walk) > 5) {
      setDragMoved(true);
    }
  };

  const handleAuthorClick = (authorName: string) => {
    if (!dragMoved) {
      onSelectAuthor(selectedAuthor === authorName ? null : authorName);
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (authors.length === 0) return null;

  return (
    <section className="author-section animate-fade-in">
      <h2 className="saga-title">Top Artists</h2>
      <div 
        className={`author-options-container ${isDragging ? 'dragging' : ''}`}
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {authors.map((author) => {
          const isSelected = selectedAuthor === author.name;
          return (
            <div 
              key={author.name} 
              className={`author-card glass glow-hover ${isSelected ? 'selected' : ''}`}
              onClick={() => handleAuthorClick(author.name)}
            >
              <h3 className="author-name text-accent">{author.name}</h3>
              <div className="author-stats">
                <div className="stat">
                  <span className="stat-value">{formatViews(author.totalViews)}</span>
                  <span className="stat-label">Views</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{author.songsCovered}/40</span>
                  <span className="stat-label">Songs</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{author.totalVideos}</span>
                  <span className="stat-label">Videos</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AuthorSection;
