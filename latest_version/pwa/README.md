# Hebrew Trainer PWA

## How to test locally on Mac

```bash
cd dist
python3 -m http.server 8000
open http://localhost:8000/pwa/
```

## How to deploy

Use GitHub Pages, Netlify, or any HTTPS hosting.

## Important iPad note

For offline PWA installation, open the HTTPS URL in Safari on iPad.

Then:

Share -> Add to Home Screen.

Open the app once while online.

Then it should work offline.

## Build note

The deployable PWA entry page is generated from the canonical root `index.html`
into `dist/pwa/index.html`. The `pwa/` source folder only keeps the manifest,
service worker, icons, and local testing notes.
