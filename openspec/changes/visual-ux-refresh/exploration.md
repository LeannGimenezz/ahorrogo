## Exploration: Visual UX + Back Navigation + Penguin Redesign

### Current State
- Frontend usa React 19 + Tailwind v4 + Framer Motion.
- Estética base oscura funcional, pero inconsistente en contraste y jerarquía visual.
- Botón volver no está garantizado en todas las pantallas.
- Pingüino depende de imágenes remotas externas.

### Affected Areas
- `frontend/src/index.css` — tokens y look global.
- `frontend/src/components/layout/TopAppBar.tsx` — experiencia de navegación.
- `frontend/src/components/layout/BottomNav.tsx` — feedback de navegación activa.
- `frontend/src/components/penguin/PenguinMascot.tsx` / `Penguin.tsx` — mascot actual.
- `frontend/src/pages/LoginPage.tsx` — pantalla sin top bar necesita back visible.

### Approaches
1. **Patch por página**
   - Pros: control fino por vista
   - Cons: mucho esfuerzo, inconsistencia futura
   - Effort: High

2. **Refactor compartido (layout + theme + mascot core)**
   - Pros: consistencia global, menor duplicación, rollout rápido
   - Cons: requiere cuidado para no romper estilos existentes
   - Effort: Medium

### Recommendation
Elegir refactor compartido: theme tokens globales + `TopAppBar` con back universal + nuevo mascot local reusable.

### Risks
- Posibles desbalances de contraste en componentes no revisados visualmente en runtime.
- Ajustes finos de estilo del pingüino según preferencia final del usuario.

### Ready for Proposal
Yes — alcance y módulos impactados están claros.
