import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { adoptGuide, replaceStep } from '../ops';
import { defaultRoadmapState } from '../state';
import { buildView } from './build';

const seq = () => { let n = 0; return () => `id-${n++}`; };

describe('buildView', () => {
  const adopted = adoptGuide(roadmapCatalog, defaultRoadmapState, 'guide-club-first', seq(), 't0').state;
  const buildId = adopted.builds[0].id;

  it('returns null for an unknown build', () => {
    expect(buildView(roadmapCatalog, adopted, 'ghost')).toBeNull();
  });
  it('shows provenance and a linearized route with no badges for untouched steps', () => {
    const vm = buildView(roadmapCatalog, adopted, buildId);
    expect(vm?.provenance).toBe('Adopted from Club-first DJ/VJ with borrowed gear (v1)');
    expect(vm?.pathTitle).toBe('DJ/VJ and Live Audiovisual Performance');
    expect(vm?.steps[0].nodeTitle).toBe('Rhythm & Song Structure');
    expect(vm?.steps.every((s) => s.originBadge === null)).toBe(true);
  });
  it('badges replaced steps with the original node title', () => {
    const gearStep = adopted.builds[0].steps.find((s) => s.nodeId === 'gear-access-practice-setup');
    const remixed = replaceStep(roadmapCatalog, adopted, buildId, gearStep?.id ?? '', 'signal-flow-rig-setup').state;
    const vm = buildView(roadmapCatalog, remixed, buildId);
    const badge = vm?.steps.find((s) => s.stepId === gearStep?.id)?.originBadge;
    expect(badge).toBe('Replaced: Gear Access & Practice Setup');
  });
  it('marks alternative-branch steps and carries progress state', () => {
    const vm = buildView(roadmapCatalog, adopted, buildId);
    const branched = vm?.steps.filter((s) => s.branchOf !== null);
    expect(branched?.length).toBe(2);
    expect(vm?.steps.every((s) => s.progressState === null)).toBe(true);
  });
});
