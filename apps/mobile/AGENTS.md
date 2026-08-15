# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Atlas visual verification

The Atlas ("Living Universe") look is verified against the design mock with a
screenshot loop — see `docs/v2/atlas-visual-rubric.md` for the rubric and the
capture/compare protocol (`apps/mobile/scripts/{slice-mock,capture-atlas,compose-compare}.mjs`).

Dev-only URL flags on the Atlas route (web): `?showcase=1` renders every node
and edge ungated with a fill-world camera, `?static=1` freezes the looping
animations for reproducible screenshots, `?theme=living|night` forces a theme.
They are view-only and never touch persisted journey state.
