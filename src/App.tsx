
import React, { useState, useRef, useEffect } from 'react';
import { STATIONS, SAMPLE_TRACKS } from './constants';
import { RadioStation, PlaybackStatus, Song } from './types';
import { Visualizer } from './components/Visualizer';

interface HistoryEntry {
  station: RadioStation;
  timestamp: Date;
}

const App: React.FC = () => {
  const [currentStation, setCurrentStation] = useState<RadioStation>(STATIONS[0]);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>(PlaybackStatus.IDLE);
  const [volume, setVolume] = useState(0.7);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [currentSong, setCurrentSong] = useState<Song>({
    id: 'initial',
    title: SAMPLE_TRACKS[STATIONS[0].id][0].title,
    artist: SAMPLE_TRACKS[STATIONS[0].id][0].artist,
    timestamp: new Date()
  });
  const [songHistory, setSongHistory] = useState<Song[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Metadata Simulator
  useEffect(() => {
    if (playbackStatus !== PlaybackStatus.PLAYING) return;

    const interval = setInterval(() => {
      const tracks = SAMPLE_TRACKS[currentStation.id] || SAMPLE_TRACKS['fox-streaming'];
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      
      const newSong: Song = {
        id: Math.random().toString(36).substr(2, 9),
        title: randomTrack.title,
        artist: randomTrack.artist,
        timestamp: new Date()
      };

      setCurrentSong(prev => {
        if (prev.title !== newSong.title) {
          setSongHistory(h => [prev, ...h].slice(0, 20));
          return newSong;
        }
        return prev;
      });
    }, 45000);

    return () => clearInterval(interval);
  }, [currentStation, playbackStatus]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const addToHistory = (station: RadioStation) => {
    setHistory(prev => {
      if (prev.length > 0 && prev[0].station.id === station.id) {
         const updated = [...prev];
         updated[0] = { ...updated[0], timestamp: new Date() };
         return updated;
      }
      const newEntry = { station, timestamp: new Date() };
      return [newEntry, ...prev].slice(0, 15);
    });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (playbackStatus === PlaybackStatus.PLAYING) {
      audioRef.current.pause();
      setPlaybackStatus(PlaybackStatus.PAUSED);
    } else {
      audioRef.current.play()
        .then(() => {
          setPlaybackStatus(PlaybackStatus.PLAYING);
          addToHistory(currentStation);
        })
        .catch(err => {
          console.error("Playback failed:", err);
          setPlaybackStatus(PlaybackStatus.IDLE);
        });
    }
  };

  const handleStationSelect = (station: RadioStation) => {
    if (currentStation.id === station.id && playbackStatus !== PlaybackStatus.IDLE) return;
    
    const wasPlaying = playbackStatus === PlaybackStatus.PLAYING || playbackStatus === PlaybackStatus.BUFFERING;
    setCurrentStation(station);
    setPlaybackStatus(PlaybackStatus.BUFFERING);
    
    const tracks = SAMPLE_TRACKS[station.id] || SAMPLE_TRACKS['fox-streaming'];
    setCurrentSong({
      id: 'switch-' + Date.now(),
      title: tracks[0].title,
      artist: tracks[0].artist,
      timestamp: new Date()
    });
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = station.streamUrl;
      audioRef.current.load();
      
      if (wasPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setPlaybackStatus(PlaybackStatus.PLAYING);
              addToHistory(station);
            })
            .catch(() => {
              setPlaybackStatus(PlaybackStatus.BUFFERING);
            });
        }
      } else {
        setPlaybackStatus(PlaybackStatus.IDLE);
      }
    }
  };

  const handleNextStation = () => {
    const currentIndex = STATIONS.findIndex(s => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % STATIONS.length;
    handleStationSelect(STATIONS[nextIndex]);
  };

  const handlePrevStation = () => {
    const currentIndex = STATIONS.findIndex(s => s.id === currentStation.id);
    const prevIndex = (currentIndex - 1 + STATIONS.length) % STATIONS.length;
    handleStationSelect(STATIONS[prevIndex]);
  };

  const preconnectStream = (url: string) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    document.head.appendChild(link);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      <audio 
        ref={audioRef} 
        src={currentStation.streamUrl} 
        crossOrigin="anonymous"
        onWaiting={() => setPlaybackStatus(PlaybackStatus.BUFFERING)}
        onPlaying={() => setPlaybackStatus(PlaybackStatus.PLAYING)}
        onPause={() => setPlaybackStatus(PlaybackStatus.PAUSED)}
        onCanPlay={() => { 
          if (playbackStatus === PlaybackStatus.BUFFERING) {
            setPlaybackStatus(PlaybackStatus.PLAYING);
            addToHistory(currentStation);
          }
        }}
        onError={() => setPlaybackStatus(PlaybackStatus.IDLE)}
      />

      {/* Sidebar - Radio List */}
      <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col hidden md:flex shrink-0" role="navigation" aria-label="Lista de estações de rádio">
        <div className="p-8">
          <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 tracking-tighter">
            NOVASTREAM
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest">Premium Virtual Audio</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-1">
          <p className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lista de Estações</p>
          {STATIONS.map((station) => (
            <button
              key={station.id}
              onClick={() => handleStationSelect(station)}
              onMouseEnter={() => preconnectStream(station.streamUrl)}
              aria-pressed={currentStation.id === station.id}
              className={`w-full group flex items-center gap-4 p-3 rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                currentStation.id === station.id 
                ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5' 
                : 'hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              <div className="relative overflow-hidden w-11 h-11 rounded-lg shrink-0">
                <img 
                  src={station.coverArt} 
                  alt="" 
                  className={`object-cover w-full h-full transition-transform duration-700 ${currentStation.id === station.id ? 'scale-110' : 'group-hover:scale-105'}`}
                />
                {currentStation.id === station.id && (playbackStatus === PlaybackStatus.PLAYING || playbackStatus === PlaybackStatus.BUFFERING) && (
                  <div className="absolute inset-0 bg-indigo-500/40 flex items-center justify-center" aria-hidden="true">
                    <div className="flex gap-0.5 items-end h-4">
                      <div className="w-1 bg-white rounded-full animate-[music-bar_0.8s_ease-in-out_infinite]"></div>
                      <div className="w-1 bg-white rounded-full animate-[music-bar_0.8s_ease-in-out_0.2s_infinite]"></div>
                      <div className="w-1 bg-white rounded-full animate-[music-bar_0.8s_ease-in-out_0.4s_infinite]"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-left overflow-hidden">
                <p className={`text-[13px] font-bold truncate ${currentStation.id === station.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                  {station.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-tighter">{station.genre}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-slate-900 bg-slate-950/80">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true"></div>
             <span className="text-[10px] text-slate-300 font-mono uppercase tracking-widest">Metadata Engine: ACTIVE</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative" role="main">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[140px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            
            {/* Header / Now Playing Hero */}
            <div className="flex flex-col lg:flex-row items-center gap-12 mb-20 mt-6">
              <div className="relative group shrink-0">
                <div className={`absolute -inset-10 rounded-full blur-[60px] transition-all duration-1000 ${playbackStatus === PlaybackStatus.PLAYING ? 'bg-indigo-500/20 opacity-100 scale-110' : 'bg-indigo-500/0 opacity-0'}`} aria-hidden="true"></div>
                <div className="relative">
                    <img 
                      src={currentStation.coverArt} 
                      alt={`Capa da rádio ${currentStation.name}`}
                      className={`w-64 h-64 md:w-80 md:h-80 object-cover rounded-full shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)] border-[6px] border-slate-800/80 transition-all duration-1000 ${playbackStatus === PlaybackStatus.PLAYING ? 'rotate-animation' : 'scale-95 grayscale-[50%]'}`}
                    />
                    <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" aria-hidden="true"></div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-950 rounded-full border-4 border-slate-900 shadow-inner flex items-center justify-center z-20" aria-hidden="true">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" aria-hidden="true"></span>
                    <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.25em]">{currentStation.genre}</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tighter leading-none">
                  {currentStation.name}
                </h2>

                {/* CURRENT SONG DISPLAY */}
                <div className="bg-white/[0.03] border border-white/5 backdrop-blur-md rounded-2xl p-6 mb-8 inline-block lg:block max-w-2xl transform transition-transform" aria-live="polite">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-2">Tocando Agora</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-1 truncate">
                    {currentSong.title}
                  </h3>
                  <p className="text-lg text-slate-300 font-medium">
                    {currentSong.artist}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center" aria-hidden="true">
                      <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path></svg>
                    </div>
                    <span className="text-sm font-bold">2,412 Ouvintes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-600/20 flex items-center justify-center" aria-hidden="true">
                      <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
                    </div>
                    <span className="text-sm font-bold">98% Feedback</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualizer and Song History Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
              
              <div className="xl:col-span-2 bg-slate-900/40 rounded-[2.5rem] border border-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
                 <div className="p-8">
                   <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${playbackStatus === PlaybackStatus.PLAYING ? 'bg-pink-500 animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-slate-700'}`} aria-hidden="true"></div>
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Live Audio Spectrum</span>
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-[10px] font-mono text-indigo-400">320kbps / 48kHz</span>
                      </div>
                   </div>
                   <Visualizer audioElement={audioRef.current} isPlaying={playbackStatus === PlaybackStatus.PLAYING} />
                 </div>
              </div>

              <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-8 border-b border-white/5">
                  <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Histórico Musical
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[300px] scrollbar-thin" aria-label="Lista de músicas tocadas anteriormente">
                  {songHistory.length > 0 ? (
                    songHistory.map((song, idx) => (
                      <div key={song.id + idx} className="flex items-center gap-4 group hover:bg-white/5 p-2 rounded-xl transition-all animate-in fade-in slide-in-from-right-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-indigo-500/30" aria-hidden="true">
                          <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 3v11H4a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V6.66l8-1.6V12h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V3z"></path></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-100 truncate group-hover:text-white">{song.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                        </div>
                        <div className="ml-auto text-[9px] font-mono text-slate-400">
                          {song.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">As músicas tocadas aparecerão aqui conforme a rádio transmite.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Station History Section */}
            <div className="bg-slate-900/20 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-sm">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                   </div>
                   <div>
                      <span className="text-xs font-black text-slate-100 uppercase tracking-[0.3em]">Canais Visitados</span>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">Últimas sintonias de rádio</p>
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {history.length > 0 ? (
                   history.map((entry, idx) => (
                     <button 
                       key={`${entry.station.id}-${entry.timestamp.getTime()}`}
                       className="flex items-center gap-4 group text-left bg-white/[0.02] hover:bg-indigo-500/5 p-4 rounded-3xl transition-all border border-white/[0.03] hover:border-indigo-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                       onClick={() => handleStationSelect(entry.station)}
                       aria-label={`Sintonizar novamente na rádio ${entry.station.name}`}
                     >
                       <img src={entry.station.coverArt} alt="" className="w-14 h-14 rounded-2xl object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 shadow-xl" />
                       <div className="flex-1 overflow-hidden">
                          <p className="text-[13px] font-bold text-slate-200 truncate group-hover:text-white">{entry.station.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                            {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                     </button>
                   ))
                 ) : (
                   <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
                      <p className="text-xs text-slate-500 font-black uppercase tracking-[0.3em]">Inicie a transmissão para gerar log</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* PLAYER BAR */}
        <footer className="h-32 bg-[#020617]/90 backdrop-blur-3xl border-t border-white/10 px-8 flex items-center relative z-20" role="contentinfo" aria-label="Controles de reprodução">
          <div className="max-w-screen-2xl mx-auto w-full flex items-center justify-between gap-12">
            
            {/* Playback Controls */}
            <div className="flex items-center gap-8">
              <button 
                onClick={handlePrevStation} 
                aria-label="Estação Anterior"
                className="text-slate-400 hover:text-white transition-all active:scale-90 p-3 hover:bg-white/5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path></svg>
              </button>
              
              <div className="relative group">
                <div className={`absolute -inset-2 rounded-full blur-xl transition-all duration-500 ${playbackStatus === PlaybackStatus.PLAYING ? 'bg-pink-500/30' : 'bg-indigo-500/20 opacity-0 group-hover:opacity-100'}`} aria-hidden="true"></div>
                <button 
                    onClick={togglePlay}
                    disabled={playbackStatus === PlaybackStatus.BUFFERING}
                    aria-label={playbackStatus === PlaybackStatus.PLAYING ? 'Pausar' : 'Reproduzir'}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${playbackStatus === PlaybackStatus.PLAYING ? 'bg-white text-black' : 'bg-indigo-600 text-white'}`}
                >
                    {playbackStatus === PlaybackStatus.BUFFERING ? (
                    <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : playbackStatus === PlaybackStatus.PLAYING ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
                    ) : (
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>
                    )}
                </button>
              </div>
              <button 
                onClick={handleNextStation} 
                aria-label="Próxima Estação"
                className="text-slate-400 hover:text-white transition-all active:scale-90 p-3 hover:bg-white/5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18l8.5-6L6 6zM16 6v12h2V6z"></path></svg>
              </button>
            </div>

            {/* Enhanced Now Playing Info */}
            <div className="flex-1 hidden md:flex items-center gap-6 max-w-2xl bg-white/[0.02] p-4 rounded-3xl border border-white/5 shadow-inner" aria-live="polite">
               <div className="relative shrink-0 overflow-hidden w-16 h-16 rounded-2xl shadow-lg border border-white/10">
                    <img src={currentStation.coverArt} alt="" className={`w-full h-full object-cover transition-all duration-1000 ${playbackStatus === PlaybackStatus.PLAYING ? 'scale-110 brightness-110' : 'opacity-40 grayscale'}`} />
                    {playbackStatus === PlaybackStatus.BUFFERING && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                        </div>
                    )}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${playbackStatus === PlaybackStatus.PLAYING ? 'bg-pink-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                        {playbackStatus === PlaybackStatus.PLAYING ? 'LIVE' : playbackStatus === PlaybackStatus.BUFFERING ? 'SINTONIZANDO' : 'IDLE'}
                    </span>
                    <h4 className="text-[14px] font-black text-white truncate uppercase tracking-tight">{currentStation.name}</h4>
                  </div>
                  <div className="overflow-hidden whitespace-nowrap">
                    <p className="text-[13px] font-bold text-indigo-400">
                      {currentSong.artist} <span className="text-slate-400 font-medium px-2" aria-hidden="true">—</span> {currentSong.title}
                    </p>
                  </div>
               </div>
            </div>

            {/* Advanced Volume Control */}
            <div className="flex items-center gap-5 w-60 bg-white/[0.04] px-6 py-4 rounded-3xl border border-white/5 shadow-xl">
                <button 
                  onClick={() => setVolume(v => v === 0 ? 0.7 : 0)} 
                  aria-label={volume === 0 ? "Ativar som" : "Mudar para mudo"}
                  className="text-slate-300 hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
                >
                    {volume === 0 ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                    )}
                </button>
                <div className="flex-1 relative h-6 flex items-center">
                    <input 
                        type="range" min="0" max="1" step="0.01" value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        aria-label="Volume"
                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400 w-8" aria-hidden="true">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </footer>
      </main>

      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        @keyframes rotate-animation {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .rotate-animation {
            animation: rotate-animation 25s linear infinite;
        }
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 18px; }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
