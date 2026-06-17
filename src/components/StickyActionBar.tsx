import React, { useState } from 'react';

interface StickyActionBarProps {
  shareUrl: string;
  onPlayNow: () => void;
  isEnabled: boolean;
}

const StickyActionBar: React.FC<StickyActionBarProps> = ({ shareUrl, onPlayNow, isEnabled }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!isEnabled) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isEnabled) return null;

  return (
    <div className="sticky-action-bar glass animate-fade-in">
      <div className="action-bar-content">
        <div className="url-box">
          <input 
            type="text" 
            readOnly 
            value={shareUrl} 
            className="url-input"
            onClick={(e) => e.currentTarget.select()}
          />
          <button className="btn-copy" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy URL"}
          </button>
        </div>
        <button className="btn-play-now glow-hover" onClick={onPlayNow}>
          ▶ Play Now
        </button>
      </div>
    </div>
  );
};

export default StickyActionBar;
