
import { RadioStation } from './types';

export const STATIONS: RadioStation[] = [
  {
    id: 'fox-streaming',
    name: 'Fox Streaming Live',
    genre: 'Mix Musical / Variedades',
    streamUrl: 'https://streaming.fox.srv.br:8150/stream',
    coverArt: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    description: 'A sua rádio personalizada transmitindo diretamente via Shoutcast v2 com alta fidelidade e latência reduzida.'
  },
  {
    id: '1',
    name: 'Synthwave Dreams',
    genre: 'Retrowave / Synthwave',
    streamUrl: 'https://icecast.retro-synthwave.com/retro-synthwave.mp3',
    coverArt: 'https://picsum.photos/seed/synth/600/600',
    description: 'Nostalgic neon beats from the 80s into the future.'
  },
  {
    id: '2',
    name: 'Lo-Fi Chill Hop',
    genre: 'Lo-Fi / Study',
    streamUrl: 'https://stream.zeno.fm/f3v5u8p7u0huv',
    coverArt: 'https://picsum.photos/seed/lofi/600/600',
    description: 'Perfect background music for coding, studying, or relaxing.'
  },
  {
    id: '3',
    name: 'Cyberpunk Underground',
    genre: 'EBM / Industrial',
    streamUrl: 'https://stream.nightride.fm/nightride.mp3',
    coverArt: 'https://picsum.photos/seed/cyber/600/600',
    description: 'Dark, gritty textures for the chrome-plated soul.'
  },
  {
    id: '4',
    name: 'Vaporwave Oasis',
    genre: 'Aesthetics',
    streamUrl: 'https://plaza.one/mp3',
    coverArt: 'https://picsum.photos/seed/vapor/600/600',
    description: 'A digital void of marble statues and slowed-down dreams.'
  }
];

export const SAMPLE_TRACKS: Record<string, {title: string, artist: string}[]> = {
  'fox-streaming': [
    { title: "Transmissão Ao Vivo", artist: "Fox Network" },
    { title: "Top Hits Mix", artist: "DJ Nova" },
    { title: "Conexão Digital", artist: "NovaStream" }
  ],
  '1': [
    { title: "Nightcall", artist: "Kavinsky" },
    { title: "Resonance", artist: "Home" },
    { title: "Turbo Killer", artist: "Carpenter Brut" }
  ],
  '2': [
    { title: "Snowfall", artist: "Øneheart x reidenshi" },
    { title: "Luv(sic)", artist: "Nujabes" },
    { title: "Weightless", artist: "Marconi Union" }
  ],
  '3': [
    { title: "Vengeance", artist: "Perturbator" },
    { title: "Cyberpunk", artist: "Max Brhon" },
    { title: "Digital Hell", artist: "Gessafelstein" }
  ],
  '4': [
    { title: "Lisa Frank 420", artist: "Macintosh Plus" },
    { title: "Enjoy Yourself", artist: "Saint Pepsi" },
    { title: "Private Island", artist: "Surfing" }
  ]
};

export const DJ_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
