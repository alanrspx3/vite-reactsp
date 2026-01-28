
export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  streamUrl: string;
  coverArt: string;
  description: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  isAI?: boolean;
}

export enum PlaybackStatus {
  PLAYING = 'playing',
  PAUSED = 'paused',
  BUFFERING = 'buffering',
  IDLE = 'idle'
}
