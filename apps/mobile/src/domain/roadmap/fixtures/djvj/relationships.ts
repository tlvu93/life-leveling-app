import type { UniverseRelationship } from '../../catalog';

// Dependency reads "to relies on from". Ordering advice stays in Guides.
export const djvjRelationships: UniverseRelationship[] = [
  // Inside the DJ/VJ constellation
  { from: 'rhythm-song-structure', to: 'mixing-technique', kind: 'dependency' },
  { from: 'rhythm-song-structure', to: 'reactive-visuals', kind: 'dependency' },
  { from: 'music-selection-library', to: 'mixing-technique', kind: 'dependency' },
  { from: 'gear-access-practice-setup', to: 'mixing-technique', kind: 'dependency' },
  { from: 'mixing-technique', to: 'club-media-player-workflow', kind: 'dependency' },
  { from: 'mixing-technique', to: 'ten-minute-av-set', kind: 'dependency' },
  { from: 'visual-composition', to: 'visual-content-library', kind: 'dependency' },
  { from: 'visual-content-library', to: 'reactive-visuals', kind: 'dependency' },
  { from: 'reactive-visuals', to: 'ten-minute-av-set', kind: 'dependency' },
  { from: 'signal-flow-rig-setup', to: 'projection-display-basics', kind: 'dependency' },
  { from: 'signal-flow-rig-setup', to: 'live-control-surfaces', kind: 'dependency' },
  { from: 'private-one-track-experiment', to: 'ten-minute-av-set', kind: 'dependency' },

  { from: 'harmonic-mixing', to: 'music-theory-fundamentals', kind: 'related' },
  { from: 'playing-an-instrument', to: 'music-theory-fundamentals', kind: 'related' },
  { from: 'observing-a-live-set', to: 'mixing-technique', kind: 'related' },
  { from: 'live-control-surfaces', to: 'reactive-visuals', kind: 'related' },

  // Bridges out of the constellation, one per neighbouring path
  {
    from: 'rhythm-song-structure', to: 'live-coding-patterns', kind: 'bridge',
    note: 'Live-coded patterns are cyclic too — phrase counting transfers straight from the booth to the editor.',
  },
  {
    from: 'projection-display-basics', to: 'surface-mapping', kind: 'bridge',
    note: 'Outputs, resolutions, and handshakes are the shared floor; mapping adds the geometry of a real surface.',
  },
  {
    from: 'mixing-technique', to: 'live-sound-basics', kind: 'bridge',
    note: 'Mixing a room and mixing a set share the same gain-staging instincts, one night at a time.',
  },
  {
    from: 'signal-flow-rig-setup', to: 'daw-fluency', kind: 'bridge',
    note: 'Signal flow is the same idea in a studio as in a booth — sources, buses, and where the level actually lives.',
  },
];
