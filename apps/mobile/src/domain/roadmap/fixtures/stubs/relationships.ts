import type { UniverseRelationship } from '../../catalog';

// Stub-depth relationships: an internal dependency spine per path, a related
// link where one is honest, and at least one cross-domain bridge. Bridges are
// authored for sense, never for quota.
export const stubRelationships: UniverseRelationship[] = [
  // Event Technology
  { from: 'stagehand-apprenticeship', to: 'live-sound-basics', kind: 'dependency' },
  { from: 'stagehand-apprenticeship', to: 'stage-lighting-dmx', kind: 'dependency' },
  { from: 'live-sound-basics', to: 'show-call', kind: 'dependency' },
  { from: 'stage-lighting-dmx', to: 'show-call', kind: 'dependency' },
  { from: 'live-sound-basics', to: 'stage-lighting-dmx', kind: 'related' },

  // Creative Coding for Music
  { from: 'live-coding-patterns', to: 'browser-video-synthesis', kind: 'dependency' },
  { from: 'live-coding-patterns', to: 'algorave-set', kind: 'dependency' },
  { from: 'browser-video-synthesis', to: 'algorave-set', kind: 'dependency' },
  {
    from: 'browser-video-synthesis', to: 'reactive-visuals', kind: 'bridge',
    note: 'A live-coded video synth is a VJ rig you typed yourself — the same beat-driven imagery, reached from the other side.',
  },

  // Projection Mapping
  { from: 'surface-mapping', to: 'mapped-installation', kind: 'dependency' },
  { from: 'site-survey', to: 'mapped-installation', kind: 'dependency' },
  { from: 'site-survey', to: 'surface-mapping', kind: 'related' },

  // Music Production
  { from: 'daw-fluency', to: 'arrangement', kind: 'dependency' },
  { from: 'arrangement', to: 'finished-track', kind: 'dependency' },
  { from: 'daw-fluency', to: 'finished-track', kind: 'dependency' },

  // Bouldering
  { from: 'gym-access', to: 'falling-safely', kind: 'dependency' },
  { from: 'falling-safely', to: 'movement-fundamentals', kind: 'dependency' },
  { from: 'movement-fundamentals', to: 'reading-problems', kind: 'dependency' },
  { from: 'reading-problems', to: 'outdoor-session', kind: 'dependency' },
  {
    from: 'movement-fundamentals', to: 'playing-an-instrument', kind: 'bridge',
    note: 'Both are embodied practices: coordination, tension, and useful repetition under fatigue.',
  },

  // Learning Japanese
  { from: 'kana', to: 'core-grammar', kind: 'dependency' },
  { from: 'core-grammar', to: 'immersion-listening', kind: 'dependency' },
  { from: 'immersion-listening', to: 'speaking-practice', kind: 'dependency' },
  { from: 'speaking-practice', to: 'first-conversation', kind: 'dependency' },
  {
    from: 'immersion-listening', to: 'observing-a-live-set', kind: 'bridge',
    note: 'Deliberate input before output: attending closely to what fluent people do is the same discipline in both crafts.',
  },

  // Woodworking
  { from: 'tool-safety', to: 'joinery-basics', kind: 'dependency' },
  { from: 'workshop-access', to: 'joinery-basics', kind: 'dependency' },
  { from: 'joinery-basics', to: 'first-box', kind: 'dependency' },
  { from: 'first-box', to: 'finished-piece', kind: 'dependency' },
  {
    from: 'workshop-access', to: 'gear-access-practice-setup', kind: 'bridge',
    note: 'Access to shared equipment — not talent or tools you own — is the real gate at the start of both crafts.',
  },

  // UX Design
  { from: 'design-fundamentals', to: 'research-basics', kind: 'dependency' },
  { from: 'research-basics', to: 'portfolio-case-study', kind: 'dependency' },
  { from: 'portfolio-case-study', to: 'first-client-or-role', kind: 'dependency' },
  { from: 'portfolio-case-study', to: 'critique-session', kind: 'related' },
  {
    from: 'portfolio-case-study', to: 'finished-track', kind: 'bridge',
    note: 'Both crafts are judged on finished, documented work rather than hours spent practising.',
  },
];
