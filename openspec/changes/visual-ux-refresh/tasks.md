# Tasks: Visual UX Refresh + Back Navigation + Penguin V2

## Phase 1: Foundation
- [x] 1.1 Update `frontend/src/index.css` with new color tokens and global app background treatment.
- [x] 1.2 Refactor `frontend/src/components/layout/TopAppBar.tsx` to expose universal back action with safe fallback.
- [x] 1.3 Improve `frontend/src/components/layout/BottomNav.tsx` active/inactive visual states.

## Phase 2: Core Implementation
- [x] 2.1 Create `frontend/src/components/penguin/PenguinIllustration.tsx` as local SVG mascot supporting all moods.
- [x] 2.2 Migrate `frontend/src/components/penguin/PenguinMascot.tsx` to use local illustration while keeping API compatibility.
- [x] 2.3 Migrate `frontend/src/components/penguin/Penguin.tsx` to use local illustration.
- [x] 2.4 Update `frontend/src/pages/LoginPage.tsx` to include visible back action.

## Phase 3: Integration / UX Consistency
- [x] 3.1 Ensure all pages using `TopAppBar` display consistent back behavior.
- [x] 3.2 Validate penguin render consistency in Home/Vaults/Profile/Create/Movements/Send/Stats.

## Phase 4: Verification
- [x] 4.1 Run `npm run build` in `frontend` and fix any TypeScript/build issues.
- [ ] 4.2 Manually review key routes for palette contrast, navigation clarity, and mascot quality.

## Phase 5: Cleanup / Documentation
- [x] 5.1 Capture verification notes in `openspec/changes/visual-ux-refresh/verify-report.md`.
