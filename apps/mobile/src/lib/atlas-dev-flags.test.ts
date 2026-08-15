import { describe, expect, it } from 'vitest';

import { defaultAtlasDevFlags, parseAtlasDevFlags } from './atlas-dev-flags';

describe('atlas dev flags', () => {
  it('defaults everything off with no params', () => {
    expect(parseAtlasDevFlags({})).toEqual(defaultAtlasDevFlags);
  });

  it('parses showcase, static, and theme params', () => {
    expect(parseAtlasDevFlags({ showcase: '1', static: '1', theme: 'night' })).toEqual({
      showcase: true,
      freeze: true,
      themeOverride: 'night',
      fps: false,
    });
  });

  it('parses the fps HUD toggle', () => {
    expect(parseAtlasDevFlags({ fps: '1' })).toMatchObject({ fps: true });
    expect(parseAtlasDevFlags({ fps: '0' })).toMatchObject({ fps: false });
  });

  it('ignores unknown theme values and non-"1" toggles', () => {
    expect(parseAtlasDevFlags({ showcase: 'yes', static: '0', theme: 'neon' })).toEqual(defaultAtlasDevFlags);
  });

  it('takes the first value of repeated params', () => {
    expect(parseAtlasDevFlags({ showcase: ['1', '0'], theme: ['living'] })).toMatchObject({
      showcase: true,
      themeOverride: 'living',
    });
  });
});
