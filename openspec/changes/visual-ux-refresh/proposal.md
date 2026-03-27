# Proposal: Visual UX Refresh + Back Navigation + Penguin V2

## Intent
Mejorar la calidad visual y la experiencia móvil de AhorroGO, agregando navegación de retorno consistente en todas las pantallas y reemplazando la mascota actual por un pingüino nuevo, más limpio y alineado con la marca.

## Scope

### In Scope
- Renovar paleta visual global (fondos, primario/secundario, contraste, estados).
- Agregar botón de volver consistente en encabezados de pantallas.
- Rediseñar mascota de pingüino para eliminar dependencia de imágenes externas.
- Ajustar navegación inferior y elementos clave para look & feel más moderno.

### Out of Scope
- Cambios funcionales de negocio (transacciones, vault logic, auth).
- Rediseño de arquitectura de datos o backend.

## Approach
Centralizar decisiones visuales en `src/index.css` y `layout` compartido, luego migrar componentes de pingüino a ilustración vectorial local reutilizable. Mantener estructura de páginas y lógica actual, cambiando únicamente presentación/UX.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/index.css` | Modified | Nueva paleta y utilidades visuales globales |
| `frontend/src/components/layout/TopAppBar.tsx` | Modified | Botón de volver consistente y comportamiento seguro |
| `frontend/src/components/layout/BottomNav.tsx` | Modified | Mejora de navegación visual activa/inactiva |
| `frontend/src/components/penguin/*` | Modified/New | Pingüino V2 sin imágenes externas |
| `frontend/src/pages/*` | Modified | Ajustes mínimos para coherencia visual y navegación |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Contraste insuficiente | Med | Revisar combinaciones en componentes críticos |
| Rotura visual por cambios globales | Med | Build + validación manual por rutas |
| Rechazo del nuevo mascot style | Low | Mantener props/moods existentes para ajuste rápido |

## Rollback Plan
Revertir cambios a los archivos de UI compartida (`index.css`, `TopAppBar`, `BottomNav`, `penguin/*`) y volver al commit previo.

## Dependencies
- Tailwind v4 tokens (`@theme`) ya configurados.
- Framer Motion existente para animaciones del mascot.

## Success Criteria
- [ ] Todas las pantallas muestran navegación de retorno consistente.
- [ ] Nueva paleta aplicada de forma homogénea sin degradar legibilidad.
- [ ] Pingüino reemplazado por versión nueva en componentes existentes.
