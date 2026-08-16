import { describe, expect, it } from 'vitest';
import type { AtlasNode, Guide } from './catalog';
import { connectEdge, createProvisionalNode, placeStep, setRole, setStance } from './guide-edit';

const nodes: AtlasNode[] = [
  { id: 'n-rhythm', type: 'foundation', title: 'Rhythm & Song Structure', description: 'd' },
  { id: 'n-theory', type: 'foundation', title: 'Music Theory Fundamentals', description: 'd' },
];
const empty: Guide = {
  id: 'draft-1', version: 1, pathId: 'p1', title: 'Draft',
  persona: { audience: '', startingPoint: '', outcome: '', assumptions: [] },
  steps: [], edges: [], stances: [], rationale: '',
};

describe('guide editing', () => {
  it('places steps, connects edges, and reports live issues on unfinished drafts', () => {
    const a = placeStep(nodes, empty, { nodeId: 'n-rhythm', role: 'required', note: '', sortKey: 0 }, 's1');
    expect(a.issues).toEqual([]);
    const b = placeStep(nodes, a.guide, { nodeId: 'ghost', role: 'required', note: '', sortKey: 1 }, 's2');
    expect(b.issues.map((i) => i.code)).toContain('unknown-node');
    const c = connectEdge(nodes, a.guide, 's1', 'missing', 'next');
    expect(c.issues.map((i) => i.code)).toContain('missing-step');
    expect(c.guide).toEqual(a.guide);
  });
  it('refuses to place a duplicate step id, leaving the draft unchanged', () => {
    const a = placeStep(nodes, empty, { nodeId: 'n-rhythm', role: 'required', note: '', sortKey: 0 }, 's1');
    const dup = placeStep(nodes, a.guide, { nodeId: 'n-theory', role: 'required', note: '', sortKey: 1 }, 's1');
    expect(dup.issues.map((i) => i.code)).toEqual(['duplicate-step']);
    expect(dup.guide).toEqual(a.guide);
  });
  it('setRole and setStance validate their targets', () => {
    const a = placeStep(nodes, empty, { nodeId: 'n-rhythm', role: 'recommended', note: '', sortKey: 0 }, 's1');
    const b = setRole(nodes, a.guide, 's1', 'required');
    expect(b.guide.steps[0].role).toBe('required');
    const c = setStance(nodes, b.guide, 'n-theory', 'structure literacy suffices');
    expect(c.issues).toEqual([]);
    expect(c.guide.stances).toEqual([{ nodeId: 'n-theory', stance: 'excluded', reason: 'structure literacy suffices' }]);
    const d = setStance(nodes, c.guide, 'n-rhythm', 'nope');
    expect(d.issues.map((i) => i.code)).toContain('stance-on-placed');
  });
  it('createProvisionalNode scopes the node to the guide and places it', () => {
    const { guide, node, issues } = createProvisionalNode(nodes, empty,
      { title: 'Open-Decks Etiquette', description: 'Sign-up norms.', type: 'experience' }, 'prov-1', 'sp-1');
    expect(issues).toEqual([]);
    expect(node.provisional).toEqual({ scopeGuideId: 'draft-1' });
    expect(guide.steps[0].nodeId).toBe('prov-1');
  });
});
