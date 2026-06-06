import React, { useEffect, useRef } from 'react';
import { X, Play, Info } from 'lucide-react';
import './styles.scss';

const VideoDemoModal = ({ isOpen, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-focus and attempt autoplay if possible
      videoRef.current?.play().catch((err) => {
        console.log("Autoplay blocked by browser. User interaction needed to play.", err);
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modalOverlay videoModalOverlay" onClick={onClose}>
      <div className="modalContent videoModalContent" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose} aria-label="Close video player">
          <X size={22} />
        </button>

        <div className="videoModalHeader">
          <div className="headerBadge">
            <Play size={12} fill="currentColor" />
            <span>PRODUCT WALKTHROUGH</span>
          </div>
          <h2>How Komunas Tracks Regulatory Changes</h2>
          <p className="subtitle">Watch how our real-time synchronization engine scans, parses, and alert you on USCIS updates.</p>
        </div>

        <div className="videoPlayerContainer">
          <video
            ref={videoRef}
            src="https://assets.mixkit.co/videos/preview/mixkit-web-development-programming-on-a-laptop-41829-large.mp4"
            className="demoVideo"
            controls
            autoPlay
            loop
            muted
            playsInline
          />
        </div>

        <div className="videoModalFooter">
          <div className="infoBanner">
            <Info size={16} />
            <span>This demonstration showcases the automated scanning frequency, change detection diffs, and workspace email alert configs.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDemoModal;
