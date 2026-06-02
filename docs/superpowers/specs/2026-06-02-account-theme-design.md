# layer418-terminal account theme — design

**Date:** 2026-06-02
**Status:** Approved for planning

## Goal

Add a Keycloakify account theme that matches the existing `layer418-terminal`
login theme so the account console feels like the same product: terminal-window
chrome, JetBrains Mono, green-on-black CRT palette, `$`/`>` command prompts.

Matching the existing aesthetic is the entire goal. No new branding content,
custom copy, or links beyond what stock Keycloak account sections provide.

## Decisions

- **Implementation:** Single-Page (`@keycloakify/keycloak-account-ui`), pinned
  to a Keycloak 26.x release (`~260601.0.0` = KC 26.6.1).
  - Originally scoped as Multi-Page (FTL pages) for full styling control, but
    Multi-Page maps to Keycloak's account-v1 pages, which were removed in
    Keycloak 25+. The target deployment is Keycloak 26.x, so Single-Page is the
    only viable option.
- **Styling strategy:** The Single-Page console is Keycloak's own React UI on
  PatternFly v5 — we don't author its markup. The theme is delivered as a CSS
  override layer (`src/account/terminal.css`) that retargets PatternFly's
  `--pf-v5-global--*` design tokens to the terminal palette + JetBrains Mono,
  plus targeted component overrides (masthead, cards, inputs, buttons, nav,
  tables). The bespoke file-tree sidebar and per-page `$`/`>` prompts from the
  Multi-Page design are NOT achievable here and are dropped.
- **Token sharing:** Extract shared design tokens so login and account can't
  drift. Modifying `login/main.css` for the extraction is approved.

## Architecture

### 1. Shared design tokens (`src/shared/tokens.css`)

Extract from `src/login/main.css` into a new shared file:

- The `@font-face` declarations for JetBrains Mono (and re-point the font
  `url()`s to a path resolvable from both themes — e.g. move the font files to
  `src/shared/fonts/` or reference via a path both CSS files can reach).
- The `:root` custom properties (`--bg`, `--green`, `--mono`, etc.).

Both `src/login/main.css` and `src/account/terminal.css` `@import` this file.
Login visuals must remain byte-identical after extraction.

### 2. Account scaffold (Single-Page)

Replicates `keycloakify initialize-account-theme` → Single-Page (the
interactive CLI needs a TTY + clean tree, so the steps are applied directly):

- `vite.config.ts`: `accountThemeImplementation: "Single-Page"`.
- `package.json`: add `@keycloakify/keycloak-account-ui` (`~260601.0.0`) and a
  `postinstall: "keycloakify sync-extensions"` script.
- `npm install` runs the postinstall, which copies Keycloak's account UI source
  into `src/account/` (PatternFly-based: `KcAccountUi.tsx`, `KcPage.tsx`,
  `root/`, `personal-info/`, `account-security/`, etc.) and adds the peer deps
  (PatternFly v5, i18next, react-router, oidc-spa, keycloak-admin-client …).
- `npx keycloakify update-kc-gen` regenerates `src/kc.gen.tsx` to route
  `themeType: "account"`.

These synced files are extension-owned (regenerated on every `npm install` via
the postinstall). To persist an edit, take ownership first:
`npx keycloakify own --path "<file>"`.

### 3. Theme injection

- `KcAccountUi.tsx` is claimed via `keycloakify own` and imports
  `./terminal.css` immediately after PatternFly's `base.css`, so the overrides
  win the cascade.

### 4. `src/account/terminal.css`

A CSS override layer (no markup changes):

- `@import "../shared/tokens.css"`.
- Retarget PatternFly v5 global tokens (`--pf-v5-global--*`) for both the light
  `:root` and `.pf-v5-theme-dark`: surfaces → bg palette, text → fg palette,
  primary/active → green, links → blue/green, status colors, monospace fonts.
- Page background: terminal grid + radial glow on `.pf-v5-c-page`.
- Component overrides: masthead → terminal titlebar (gradient, green accent,
  faux traffic-lights + prompt label), nav current-item green, cards →
  bg-2/line-2 with glow, form-controls → black w/ green focus + `>` labels,
  primary buttons → green w/ `$ ` prefix, tables → monospace w/ green headers,
  alerts, tabs.

### 5. Verification

- `npm run build` (tsc + vite) builds login + account console — passes.
- Full theme jar (`npm run build-keycloak-theme`) needs Maven (CI dockerfile
  provides it).
- Visual verification of the SPA requires a running Keycloak 26
  (`npx keycloakify start-keycloak`); the masthead titlebar treatment in
  particular needs visual tuning there, since the SPA can't be previewed via
  `npm run dev` (it needs an OIDC backend). No Storybook for Single-Page.

## Out of scope

- Email theme.
- Multi-Page (account-v1) console — incompatible with Keycloak 25+.
- Any login behavior/visual change beyond the token extraction.
- Custom account copy, branding, or links beyond stock sections.
