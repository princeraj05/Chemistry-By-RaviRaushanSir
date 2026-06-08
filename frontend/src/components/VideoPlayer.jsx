import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, 
  Settings, CheckCircle2, ChevronRight, Download
} from 'lucide-react';
import axios from 'axios';

const VideoPlayer = ({ 
  videoId, 
  videoUrl, 
  title, 
  initialTime = 0, 
  token,
  notesUrl,
  onProgressSaved 
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(0);
  const [videoError, setVideoError] = useState('');

  // Resume playback on load
  useEffect(() => {
    if (videoRef.current && initialTime > 2) {
      videoRef.current.currentTime = initialTime;
      setShowResumeBanner(true);
      setTimeout(() => setShowResumeBanner(false), 5000);
    }
    setIsPlaying(false);
    setProgress(0);
    setVideoError('');
  }, [videoId, initialTime]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleVideoError = (e) => {
    console.error('Video loading error event:', e);
    if (videoRef.current && videoRef.current.error) {
      const err = videoRef.current.error;
      console.error(`MediaError: code=${err.code}, message=${err.message}`);
      switch (err.code) {
        case 1:
          setVideoError('Playback aborted by user request.');
          break;
        case 2:
          setVideoError('Network error occurred while fetching video.');
          break;
        case 3:
          setVideoError('Video decoding failed. The format may not be supported by your browser.');
          break;
        case 4:
          setVideoError('The video could not be loaded, either because the server or network failed or because the format is not supported.');
          break;
        default:
          setVideoError(err.message || 'An unknown error occurred while loading video.');
      }
    } else {
      setVideoError('Failed to load video stream. Please verify your internet connection or video file.');
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.log('Playback blocked or failed:', e));
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 0;
      setCurrentTime(current);
      setDuration(total);
      setProgress(total > 0 ? (current / total) * 100 : 0);

      // Periodically sync watch history (every 5 seconds) to avoid spamming the DB
      if (Math.abs(current - lastSavedTime) >= 5 && token) {
        saveProgress(current, false);
        setLastSavedTime(current);
      }
    }
  };

  const saveProgress = async (time, isCompleted) => {
    try {
      await axios.post(
        `/api/videos/${videoId}/progress`,
        { lastWatchedTime: Math.floor(time), completed: isCompleted },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onProgressSaved) onProgressSaved({ lastWatchedTime: time, completed: isCompleted });
    } catch (error) {
      console.error('Failed to save watch progress:', error);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (token) {
      saveProgress(duration, true);
    }
  };

  const handleSeek = (e) => {
    const seekValue = parseFloat(e.target.value);
    if (videoRef.current && duration > 0) {
      const newTime = (seekValue / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(seekValue);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const muted = !isMuted;
      setIsMuted(muted);
      videoRef.current.muted = muted;
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Video Frame */}
      <div 
        ref={containerRef} 
        className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 group border border-slate-800 shadow-2xl"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onClick={togglePlay}
          onPlay={handlePlay}
          onPause={handlePause}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleVideoError}
          preload="metadata"
        />

        {videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-rose-450 p-6 text-center z-20">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
            <h3 className="text-sm font-extrabold text-slate-200">Playback Failed</h3>
            <p className="text-xs text-slate-450 mt-1 max-w-sm">{videoError}</p>
          </div>
        )}

        {/* Resume Banner */}
        {showResumeBanner && (
          <div className="absolute top-4 left-4 right-4 glass-panel p-3.5 rounded-xl flex items-center justify-between text-xs md:text-sm animate-fadeIn bg-slate-900/90 border border-cyan-500/20 z-10">
            <span className="flex items-center text-cyan-400 font-medium">
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              Resumed playback from where you left off ({formatTime(initialTime)}).
            </span>
            <button 
              onClick={() => setShowResumeBanner(false)}
              className="text-slate-400 hover:text-slate-100 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Huge Play/Pause overlay indicator */}
        {!isPlaying && (
          <div 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/40 cursor-pointer transition-opacity duration-300 group-hover:bg-slate-950/50"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 backdrop-blur-md glow-btn">
              <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          
          {/* Progress Slider */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-300">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="flex-grow h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-cyan-400"
            />
            <span className="text-xs font-medium text-slate-350">{formatTime(duration)}</span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play / Pause */}
              <button 
                onClick={togglePlay} 
                className="text-slate-200 hover:text-cyan-400 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2 group/volume">
                <button onClick={toggleMute} className="text-slate-200 hover:text-cyan-400">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 rounded-lg appearance-none cursor-pointer bg-slate-850 accent-cyan-400 group-hover/volume:w-20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Playback speed selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="flex items-center space-x-1 text-xs font-semibold text-slate-200 hover:text-cyan-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{playbackSpeed}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-855 rounded-xl py-1.5 shadow-2xl w-24 flex flex-col z-20">
                    {[0.5, 1, 1.25, 1.5, 2].map((sp) => (
                      <button
                        key={sp}
                        onClick={() => handleSpeedChange(sp)}
                        className={`text-left px-3 py-1.5 text-xs hover:bg-sky-500/10 hover:text-cyan-400 font-medium ${playbackSpeed === sp ? 'text-cyan-400' : 'text-slate-300'}`}
                      >
                        {sp === 1 ? 'Normal' : `${sp}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button 
                onClick={toggleFullscreen} 
                className="text-slate-200 hover:text-cyan-400 transition-colors"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Title & Notes Row */}
      <div className="flex items-center justify-between bg-slate-900/40 border border-slate-850 p-4 rounded-2xl">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-100">{title}</h2>
          <p className="text-xs text-slate-400">Streamed via Cloudinary Storage</p>
        </div>
        {notesUrl && (
          <a
            href={notesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-cyan-500/10 transition-all text-xs md:text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Notes</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
