import type { Path } from '../../catalog';

// Content source: docs/product/research/dj-vj-route-research.md §1 (as of 2026-08).
export const djvjPath: Path = {
  id: 'djvj',
  title: 'DJ/VJ and Live Audiovisual Performance',
  status: 'full',
  interestIds: ['music', 'technology'],
  featuredGuideId: 'guide-club-first',
  overview: {
    whatItIs:
      'The craft of performing recorded or generated sound and image for a room, in real time. A DJ selects and blends recorded music so a night feels continuous and alive; a VJ performs visuals — video loops, generative graphics, live-coded imagery — in sync with that music; an audiovisual performer does some of both. Practitioners on both sides describe the core skill the same way: less about the equipment, more about selection, timing, and reading the room.',
    settings: [
      'Club and bar booths: warm-up slots, peak-time sets, and the etiquette that goes with them. Clubs standardize on the same media-player hardware, so performers arrive with a prepared USB stick and headphones.',
      'Open decks and open-projector nights: the scene’s open-mic equivalent — sign-up sheets, short sets, venue-supplied gear, and a strong stay-and-watch-everyone-else norm.',
      'Alongside a DJ, at the side of the stage: working VJs perform from a table with sightlines to the floor, syncing by tapped tempo to a DJ they often cannot wire into.',
      'Livestreams: a streamed short set is the lowest-stakes first outlet, though platform choice is now a licensing decision as much as a technical one.',
      'Algoraves and art spaces: live-coded music and visuals with the code projected, plus gallery installations at the projection-mapping edge of the practice.',
    ],
    variants: [
      'DJ-led: music performance first; visuals are a supporting layer, such as tempo-synced loops or video mixed inside DJ software.',
      'VJ-led: visual performance first, usually clip-based in a layer-grid tool, performed alongside DJs and synced by tap tempo and phrasing.',
      'No-code: both of the above are fully practicable without programming — clip decks, knobs, faders, and pre-made or purchased content. The fastest documented route to a first gig.',
      'Generative / live-coded: building your own instrument in a node-based environment, or live-coding visuals and patterns in the browser with free, zero-install tools.',
    ],
    realities: [
      'Time: a first beatmatched blend is possible in an afternoon; a clean home set takes one to three months of consistent practice; first real gigs commonly arrive at six to twelve months. On the visual side the clip route can be gig-ready in two to three months; the generative route takes longer. Consistency beats session length in every account.',
      'Cost (as of mid-2026): genuine zero-cost starts exist on both sides — free open-source DJ software, an indefinite watermarked VJ trial, free non-commercial generative licenses, and free Creative-Commons loop libraries. The standard first purchase on the DJ side is a roughly $330 two-channel controller; on the VJ side, a laptop with a dedicated mid-range GPU. The hidden ongoing cost for DJs is the music itself.',
      'Equipment and access: nobody buys the club booth — club-standard players cost thousands each and every serious venue already has them. Access is the real problem, with real solutions: hourly rehearsal rooms with club-standard booths, open-decks nights, and asking a venue for pre-opening practice time. VJs likewise rarely buy projectors for gigs; many venues have screens and no VJ.',
      'Live settings: venue gear differs from home setups and is not always in good condition; nerves peak in the first minutes and pass; the documented failure modes are unfamiliar hardware and missing backups on the audio side, and cable, handshake, and resolution failures on the visual side. Audiences reliably notice selection and energy, not fluffed transitions.',
    ],
    foundations:
      'Nearly every real curriculum converges on the same small set of foundations: rhythm and song structure (phrasing), knowing your material cold, signal flow, and performing for real people early and often. Almost everything else is genuinely contested — manual beatmatching before sync, whether music theory helps at all, automated versus performed visuals, cheap gear versus club-standard gear, stock content versus original. Different Guides through this Path take different sides, and that is expected.',
  },
  nodeIds: [
    'rhythm-song-structure',
    'music-selection-library',
    'music-theory-fundamentals',
    'playing-an-instrument',
    'harmonic-mixing',
    'mixing-technique',
    'signal-flow-rig-setup',
    'gear-access-practice-setup',
    'visual-composition',
    'visual-content-library',
    'reactive-visuals',
    'projection-display-basics',
    'live-control-surfaces',
    'club-media-player-workflow',
    'observing-a-live-set',
    'private-one-track-experiment',
    'ten-minute-av-set',
  ],
  neighborPathIds: ['music-production', 'creative-coding-music', 'projection-mapping', 'event-technology'],
};
