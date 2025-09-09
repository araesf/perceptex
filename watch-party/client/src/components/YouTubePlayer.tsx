import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onReady: (player: any) => void;
  onStateChange: (event: any) => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, onReady, onStateChange }) => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const initializePlayer = () => {
      if (window.YT && window.YT.Player) {
        // Destroy existing player first
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
        }
        
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            disablekb: 0,
            enablejsapi: 1,
            fs: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0
          },
          events: {
            onReady: (event: any) => onReady(event.target),
            onStateChange: onStateChange
          }
        });
      }
    };

    // Add delay to prevent rapid re-initialization
    const timeoutId = setTimeout(() => {
      if (window.YT) {
        initializePlayer();
      } else {
        window.onYouTubeIframeAPIReady = initializePlayer;
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  return <div id="youtube-player" className="w-full h-full min-h-[500px]" />;
};

export default YouTubePlayer;
