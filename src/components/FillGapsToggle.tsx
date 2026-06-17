import React from 'react';

interface FillGapsToggleProps {
  fillGaps: boolean;
  onToggle: (checked: boolean) => void;
  selectedAuthor: string;
}

const FillGapsToggle: React.FC<FillGapsToggleProps> = ({ fillGaps, onToggle, selectedAuthor }) => {
  return (
    <div className="fill-gaps-container animate-fade-in">
      <div className="fill-gaps-info">
        <span className="fill-gaps-title">Complete the Musical?</span>
        <span className="fill-gaps-subtitle">
          {fillGaps 
            ? `Showing all songs. Gaps filled with popular videos.`
            : `Showing strict portfolio for ${selectedAuthor}.`}
        </span>
      </div>
      <label className="switch">
        <input 
          type="checkbox" 
          checked={fillGaps} 
          onChange={(e) => onToggle(e.target.checked)} 
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
};

export default FillGapsToggle;
