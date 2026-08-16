import type { Guide } from '../../catalog';

// Content source: docs/product/research/dj-vj-route-research.md §4 (as of 2026-08).
export const guideVisualFirst: Guide = {
  id: 'guide-visual-first',
  version: 1,
  pathId: 'djvj',
  title: 'Visual-first reactive performance',
  persona: {
    audience:
      'Visually-minded adults — designers, coders, generative-art-curious — who want to perform live images, usually alongside DJs, and who may have no music background at all.',
    startingPoint:
      'A laptop with a dedicated mid-range GPU, or willingness to get a used gaming laptop. Comfort learning visual software. A zero software budget is viable.',
    outcome:
      'Perform a reactive visual set alongside a DJ at a real event — realistically gig-ready in two to three months on the clip route, longer on the generative branch.',
    assumptions: [
      'You practice at home to recorded DJ sets — no rental rooms, no music purchases.',
      'Venues often have screens with no VJ; a short reel and an offer to do a first night free gets you in the room.',
      'Reliability matters more than talent at the start; know the working norms before you take paid work.',
    ],
  },
  steps: [
    { id: 'b1', nodeId: 'visual-composition', role: 'required', note: 'Layers, blend modes, color, restraint — the craft that separates a performed set from a screensaver.', sortKey: 0 },
    { id: 'b2', nodeId: 'rhythm-song-structure', role: 'required', note: 'Not theory — structure literacy. When you know what is coming next, you can prepare the right visuals and trigger them at the right moment. Playing off the beat is a canonical beginner mistake.', sortKey: 1 },
    { id: 'b3', nodeId: 'visual-content-library', role: 'required', note: 'Start with free Creative-Commons loops and remix them with effects until your own content exists — with the honest caveat that everyone uses them. Loops cut to short beat-lengths; codecs converted for smooth playback.', sortKey: 2 },
    { id: 'b4', nodeId: 'reactive-visuals', role: 'required', note: 'Both mechanisms as separate skills: tap-tempo sync (the working VJ’s workhorse for a DJ you cannot wire into) and audio-driven parameters. Reactivity is a layer under a performed set, not a replacement for the performer.', sortKey: 3 },
    { id: 'b5', nodeId: 'signal-flow-rig-setup', role: 'required', note: 'The second video output nobody warns you about, and the adapter tax: quality cables, active adapters, a laptop-free backup loop player.', sortKey: 4 },
    { id: 'b6', nodeId: 'projection-display-basics', role: 'required', note: 'Ask before every gig: exact wall resolution, cable standard, where you physically stand. Untested dongles are the documented way first VJ sets die.', sortKey: 5 },
    { id: 'b7', nodeId: 'live-control-surfaces', role: 'required', note: 'Map a clip-grid controller; the de facto standard grid mirrors the layer/column layout, and another VJ on the bill probably has one if yours dies.', sortKey: 6 },
    { id: 'b8', nodeId: 'observing-a-live-set', role: 'recommended', note: 'See what other people do with visuals — generative art, 3D, lighting — not just other VJs’ clip packs.', sortKey: 7 },
    {
      id: 'b9', nodeId: 'private-one-track-experiment', role: 'checkpoint',
      note: 'At home, private, no stakes.', sortKey: 8,
      quest: { id: 'q-b-map', kind: 'try', prompt: 'Map two visual changes to one song section of a recorded set, at home, private.' },
    },
    { id: 'b10', nodeId: 'ten-minute-av-set', role: 'required', note: 'One deck of 10-20 loops in two or three energy tiers, tap-tempo synced, one audio-reactive layer, a pre-rendered fallback loop — performed alongside a DJ or streamed.', sortKey: 9 },
    { id: 'b-gear', nodeId: 'gear-access-practice-setup', role: 'recommended', note: 'Check the laptop you own against the software’s GPU guidance; the used gaming-laptop market is the budget route. A TV or borrowed projector covers home practice.', sortKey: 10 },
    { id: 'b-mix', nodeId: 'mixing-technique', role: 'alternative', note: 'For explorers who want to drive the audio too: the one-laptop video-DJ shape, accepting the documented stability tradeoff of one machine doing everything.', sortKey: 11 },
    { id: 'b-musicsel', nodeId: 'music-selection-library', role: 'optional-depth', note: 'Only needed if you take the DJ-technique branch: a library of your own to select from.', sortKey: 12 },
  ],
  edges: [
    { from: 'b1', to: 'b2', kind: 'next' },
    { from: 'b2', to: 'b3', kind: 'next' },
    { from: 'b3', to: 'b4', kind: 'next' },
    { from: 'b4', to: 'b5', kind: 'next' },
    { from: 'b5', to: 'b6', kind: 'next' },
    { from: 'b6', to: 'b7', kind: 'next' },
    { from: 'b7', to: 'b8', kind: 'next' },
    { from: 'b8', to: 'b9', kind: 'next' },
    { from: 'b9', to: 'b10', kind: 'next' },
    { from: 'b1', to: 'b-gear', kind: 'next' },
    { from: 'b6', to: 'b-mix', kind: 'alternative' },
    { from: 'b-mix', to: 'b-musicsel', kind: 'next' },
    { from: 'b-musicsel', to: 'b8', kind: 'next' },
  ],
  stances: [
    {
      nodeId: 'music-theory-fundamentals',
      stance: 'excluded',
      reason: 'No VJ source demands formal theory; what you need is structure literacy, and that is Step 2 in its entirety.',
    },
    {
      nodeId: 'playing-an-instrument',
      stance: 'excluded',
      reason: 'Instrument hours serve the audio craft this route does not touch. Spend those hours on your controller — performed visuals are their own instrument.',
    },
  ],
  rationale:
    'This route treats the image as the instrument. Composition comes before everything because busy visuals are the beginner tell; structure literacy replaces music theory because anticipating the drop matters and naming the chord does not. Reactive layers support a performed set rather than replacing the performer. DJ technique is a real branch for those who want one laptop doing both jobs — with its stability tradeoff stated, not hidden. The gig economics are reel-first: venues with screens and no VJ are the way in.',
};
