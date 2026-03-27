# Delta for Frontend UI

## ADDED Requirements

### Requirement: Global Visual Theme Refresh
The system MUST expose an updated design token palette for background, surfaces, primary/secondary accents, and readable text contrast across all mobile routes.

#### Scenario: New palette applied globally
- GIVEN the user opens any app route
- WHEN the UI is rendered
- THEN the new theme tokens SHALL be used for background and surface styles
- AND text SHALL keep accessible contrast against those surfaces

### Requirement: Universal Back Navigation Control
The system MUST provide a visible "volver" action in the top app bar for all routed screens where a top bar is present.

#### Scenario: Back action with browser history
- GIVEN the user has previous navigation history
- WHEN they tap the back button
- THEN the app SHALL navigate to the previous route

#### Scenario: Back action without browser history
- GIVEN the user has no meaningful previous route
- WHEN they tap the back button
- THEN the app SHALL navigate to `/` as safe fallback

### Requirement: Penguin V2 Local Illustration
The system MUST replace remote penguin image dependencies with a local reusable illustration component supporting existing moods and sizes.

#### Scenario: Mascot render in different moods
- GIVEN a page requests a mascot mood (happy, guide, celebrate, etc.)
- WHEN mascot components render
- THEN the app SHALL display the new local penguin illustration
- AND animations SHOULD vary by mood

## MODIFIED Requirements

### Requirement: Bottom Navigation Visual Feedback
The bottom nav SHOULD show stronger active state affordance than inactive items using token-based colors and micro-interactions.

#### Scenario: Active tab clarity
- GIVEN the user is on an active route
- WHEN bottom navigation is visible
- THEN the active tab SHALL be visually distinct from inactive tabs

## REMOVED Requirements

### Requirement: Remote Penguin Image URL Dependency
(Reason: avoid brittle external image links and improve brand consistency with in-app vector artwork)
