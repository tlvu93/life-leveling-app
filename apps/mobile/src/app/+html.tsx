import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Custom web HTML shell: preloads the CanvasKit WASM (~8 MB) in parallel with
// the JS bundle so the Atlas canvas becomes interactive sooner.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preload" href="/canvaskit.wasm" as="fetch" type="application/wasm" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
