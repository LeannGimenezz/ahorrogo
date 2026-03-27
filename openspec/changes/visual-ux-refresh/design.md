# Design: Visual UX Refresh + Back Navigation + Penguin V2

## Technical Approach
Concentrar mejoras en componentes compartidos y tokens globales para impactar todas las pantallas sin tocar lógica de negocio. Reemplazar assets externos del pingüino con SVG local animado.

## Architecture Decisions

| Decision | Alternatives | Rationale |
|---|---|---|
| Centralizar paleta en `src/index.css` | editar página por página | Menor riesgo y consistencia global inmediata |
| Back button en `TopAppBar` con fallback a `/` | botón manual por cada page | Evita duplicación y cumple consistencia UX |
| Pingüino V2 vectorial local | mantener URL remota | Control visual total, offline-friendly, sin dependencia externa |
| Mantener props actuales (`mood`, `size`) | API nueva | Cambios no disruptivos en pages ya implementadas |

## Data Flow

`Page` → `TopAppBar` (resolve back action)  
`Page` → `PenguinMascot`/`Penguin` → `PenguinIllustration`  
`Styles` → `index.css @theme` → all components via utility classes

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/index.css` | Modify | Nueva paleta + fondo visual global + utilidades de superficie |
| `frontend/src/components/layout/TopAppBar.tsx` | Modify | Back action universal y header refinado |
| `frontend/src/components/layout/BottomNav.tsx` | Modify | Activo/inactivo más claro y visual moderno |
| `frontend/src/components/penguin/PenguinIllustration.tsx` | Create | SVG reusable para mascot V2 |
| `frontend/src/components/penguin/PenguinMascot.tsx` | Modify | Reemplazo de imagen externa por ilustración local |
| `frontend/src/components/penguin/Penguin.tsx` | Modify | Wrapper legacy con nueva ilustración |
| `frontend/src/pages/LoginPage.tsx` | Modify | Agregar acción de volver visible en pantalla sin top bar |

## Interfaces / Contracts
```ts
// PenguinIllustration props
interface PenguinIllustrationProps {
  mood?: 'idle' | 'happy' | 'celebrate' | 'thinking' | 'guide' | 'sleep' | 'wave' | 'encourage';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Build/Type | Integridad TS + bundling | `npm run build` en frontend |
| Visual regression manual | Header/back/nav/palette/mascot | Revisión manual por rutas principales |
| UX fallback | Back sin history | abrir ruta directa y probar navegación |

## Migration / Rollout
No migration required.

## Open Questions
- [ ] Validar preferencias finales de branding del pingüino V2 con el usuario.
