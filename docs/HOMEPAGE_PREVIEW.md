# Personal landing page preview

The `/` route now has a separate layout from the workspace. It uses an opaque,
muted reading surface and an interactive ASCII landscape rather than the shared
sidebar, status header, wallpaper and terminal. `/workspace`, articles, projects
and admin retain their existing layouts. Both expanded and collapsed workspace
brand links return to `/`; the tablet drawer now remains accessible up to the
desktop sidebar breakpoint.

## Content and rendering

- Owner identity and contacts use existing profile settings.
- Status, tasks and the fallback quotation use existing homepage settings.
- The featured project uses the public project API with the existing portfolio
  catalogue as fallback. The latest article is fetched from the public blog API.
- Spotify and the daily gift retain their existing API integrations. Playback
  failures display the existing unavailable state, without inventing a song.
- React Bits GradientASCII was adapted to a Vue lifecycle wrapper and a plain
  WebGL2 renderer. Source and license are recorded in
  `public/licenses/react-bits.md`. It is part of this application, not published
  as a standalone component package.
- The renderer caps at approximately 30 fps and DPR 1, pauses offscreen and in
  hidden tabs, supports a pause control and reduced motion, and displays a local
  poster if WebGL2 is unavailable. The old vector-field card is not displayed.

## Isolated deployment

Dispatch `deploy-frontend.yml` with `preview=true` on the preview branch.
The build uses `/previews/home-ascii/`, hash routing, a noindex meta tag, and no
service worker. It publishes into a separate server preview directory and links
that directory beneath the current frontend release. It does not switch the
production release pointer or deploy the backend.

Preview URL: `https://www.gellaronline.cc/previews/home-ascii/`

This is a public visual preview using public production content. It is not a
backend sandbox. A later production release may replace the containing directory;
redispatch the preview if its link is removed.

## Verification

Production and preview builds pass. Frontend log checks, four Spotify composable
tests, bundle budgets and environment-example checks pass. Public SEO checks
passed for the production build.

Browser checks cover 320, 390, 768 and 1440px, workspace entry and return via the
brand, tablet drawer navigation, hash-route refresh, pause, light/dark themes,
real project image loading and the no-WebGL fallback. No horizontal overflow
was measured after correcting the footer icon's flex sizing.

The design inspector's blanket bans on ASCII gradients and its minimum photo and
animation counts are not applied: this preview intentionally uses the requested
ASCII artwork and real selected work. Dates are retained as article metadata.
The lazy project image was separately scrolled into view and decoded in-browser.

During testing the production Spotify endpoint returned 503. This is independent
of the landing-page layout and remains an API-side limitation.
