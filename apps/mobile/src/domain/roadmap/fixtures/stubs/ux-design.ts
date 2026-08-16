import type { AtlasNode, Guide, Path } from '../../catalog';

// Breadth stress-test stub. Pressure point: the share surface IS the outcome —
// a portfolio-shaped route where selective sharing carries the payoff.
export const uxDesignNodes: AtlasNode[] = [
  { id: 'design-fundamentals', type: 'foundation', title: 'Design Fundamentals', description: 'Hierarchy, typography, layout, and interaction basics — the craft under every screen.' },
  { id: 'research-basics', type: 'skill', title: 'Research Basics', description: 'Talking to users, running small tests, and separating what people say from what they do.' },
  { id: 'portfolio-case-study', type: 'project', title: 'Portfolio Case Study', description: 'One real problem, documented honestly: context, process, decisions, outcome.' },
  { id: 'critique-session', type: 'experience', title: 'Critique Session', description: 'Showing work to practitioners and hearing what lands — the fastest feedback loop in the field.' },
  { id: 'first-client-or-role', type: 'milestone', title: 'First Client or Role', description: 'Paid work — a freelance project, internship, or junior role — won largely on the portfolio.' },
];

export const uxDesignPath: Path = {
  id: 'ux-design',
  title: 'UX Design',
  status: 'stub',
  interestIds: ['design', 'technology'],
  overview: {
    whatItIs:
      'Designing how software works for the people using it. The route debates are real — bootcamp versus self-taught versus degree — but every route converges on the same currency: a portfolio of honest case studies. The outcome is employment-shaped, and what you choose to show is the craft’s own selective-sharing problem.',
    settings: ['Self-study, bootcamps, degree programs, and open critique communities.'],
    variants: ['Bootcamp; self-taught portfolio-first; degree.'],
    realities: ['Free tools cover the whole learning route; the scarce resources are real problems to work on and honest feedback.'],
    foundations: 'Fundamentals plus one deeply documented case study beat a dozen shallow shots.',
  },
  nodeIds: ['design-fundamentals', 'research-basics', 'portfolio-case-study', 'critique-session', 'first-client-or-role'],
  neighborPathIds: [],
};

export const uxDesignGuide: Guide = {
  id: 'guide-portfolio-first',
  version: 1,
  pathId: 'ux-design',
  title: 'Portfolio-first UX',
  persona: {
    audience: 'Career-changers and self-taught designers aiming for paid work.',
    startingPoint: 'Curiosity and free tools; no design background assumed.',
    outcome: 'A first client or role, won on a small, honest portfolio.',
    assumptions: ['One real problem documented deeply beats invented redesigns.', 'You choose what the portfolio shows; the rest stays private.'],
  },
  steps: [
    { id: 'ux1', nodeId: 'design-fundamentals', role: 'required', note: 'The craft under every screen.', sortKey: 0 },
    { id: 'ux2', nodeId: 'research-basics', role: 'required', note: 'What people do beats what they say.', sortKey: 1 },
    { id: 'ux3', nodeId: 'portfolio-case-study', role: 'checkpoint', note: 'One real problem, documented honestly.', sortKey: 2 },
    { id: 'ux4', nodeId: 'critique-session', role: 'recommended', note: 'Show the work; hear what lands.', sortKey: 3 },
    { id: 'ux5', nodeId: 'first-client-or-role', role: 'required', note: 'Won largely on the case study.', sortKey: 4 },
  ],
  edges: [
    { from: 'ux1', to: 'ux2', kind: 'next' },
    { from: 'ux2', to: 'ux3', kind: 'next' },
    { from: 'ux3', to: 'ux4', kind: 'next' },
    { from: 'ux4', to: 'ux5', kind: 'next' },
  ],
  stances: [],
  rationale: 'The portfolio is the route’s share surface and its outcome at once: the case-study checkpoint sits mid-route because everything after it is showing the work.',
};
