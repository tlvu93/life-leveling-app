/**
 * Progress framing is an open assumption (decisions A-008/A-009), not a settled
 * rule: the build ships count framing and no marker, and a moderator can switch
 * mid-session to gather evidence.
 */
export type ProgressFraming = 'count' | 'percent';
export type FramingFlags = { framing: ProgressFraming; marker: boolean };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function framingFlagsFrom(params: Record<string, string | string[] | undefined>): FramingFlags {
  return {
    framing: first(params.framing) === 'percent' ? 'percent' : 'count',
    marker: first(params.marker) === '1',
  };
}

export function progressLabel(flags: FramingFlags, applyCount: number, totalNodes: number): string {
  if (flags.framing === 'percent') {
    const percent = totalNodes === 0 ? 0 : Math.round((applyCount / totalNodes) * 100);
    return `${percent}% explored`;
  }
  if (applyCount === 0) return 'Nothing here yet — that is a starting point, not a gap';
  return `${applyCount} thing${applyCount === 1 ? '' : 's'} you have practised apply here`;
}
