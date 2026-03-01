---
shaping: true
---

# Zoom & Layout — Shaping

## Source

> voglio migliorare le funzionalità di zoom:
> - la timeline principale dovrebbe stare a "metà" del viewport, così da distribuire i contesti tra sopra e sotto in base alle collisioni
> - Al load del timeline principale, tutto il contesto dovrebbe fare il fit al viewport orizzontale.
> - lo zoom tramite mousewheel dovrebbe essere più morbido, adesso è impossibile da controllare
> - i pulsanti +/- non fanno niente. Dovrebbe esserci anche un pulsante per resettare la view allo stato originale
>
> (screenshot allegato: asse centrale, sub-contesti come barre sopra l'asse, eventi come marker sotto)

---

## Requirements (R)

| ID | Requisito | Status |
|----|-----------|--------|
| R0 | L'asse principale è posizionato al 50% verticale del canvas (non fisso a y=48px) | Core goal |
| R1 | I sub-contesti (barre colorate) crescono verso l'alto dall'asse; gli eventi crescono verso il basso | Must-have |
| R2 | Il fit-to-viewport al caricamento include l'intero range: eventi + estensione dei sub-contesti figli | Must-have |
| R3 | Il mousewheel zoom è proporzionale all'entità dello scroll — fluido su trackpad, controllabile su mouse | Must-have |
| R4 | I bottoni +/− funzionano — il drag handler non intercetta i click sui bottoni | Must-have |
| R5 | Il bottone reset ha affordance chiara e riporta alla visione completa del contesto con animazione | Must-have |

---

## Diagnosi del sistema attuale (CURRENT)

| Componente | Problema |
|-----------|---------|
| `TimelineAxis.tsx:14` | `AXIS_Y = 48` hardcoded — asse fisso a 48px dal top |
| `EventMarker.tsx:15` | `AXIS_Y = 48` hardcoded — eventi si disegnano sopra l'asse (verso y=0) |
| `EventCluster.tsx` | Usa `AXIS_Y` hardcoded — stesso problema |
| `SubTimelineBars.tsx:21` | `SUB_Y_OFFSET = 72` hardcoded — barre sotto l'asse (verso y=canvasHeight) |
| `TimelineCanvas.tsx:118` | `delta = deltaY < 0 ? 1.4 : 0.71` — zoom binario, ogni evento wheel = ×1.4 |
| `TimelineCanvas.tsx:130–161` | `pointerdown` chiama `el.setPointerCapture(e.pointerId)` — cattura tutti gli eventi pointer inclusi i click sui bottoni |
| `TimelineCanvas.tsx:94` | `computeTimelineRange(events, softStartYear, softEndYear)` — non include i range dei sub-contesti figli |
| `ZoomControls.tsx:29` | Bottone fit ha icona-griglia non riconoscibile come "reset" |

---

## A: Asse centrato con layout bifronte

| Part | Mechanism |
|------|-----------|
| **A1** | **axisY dinamico** — `TimelineCanvas` calcola `axisY = canvasHeight / 2` e lo passa come prop a `TimelineAxis`, `EventMarker`, `EventCluster`, `SubTimelineBars`; rimuove la costante `AXIS_Y = 48` da tutti i file |
| **A2** | **Sub-contesti sopra l'asse** — `SubTimelineBars`: `y = axisY - (i+1) * (BAR_HEIGHT + BAR_GAP)` (barre crescono verso y=0, stacked upward) |
| **A3** | **Eventi sotto l'asse** — `EventMarker` e `EventCluster`: stem da `axisY` verso il basso (`axisY + stemLength`), shape e label a `axisY + stemLength + margin` |
| **A4** | **Fit range corretto** — `computeTimelineRange` riceve anche `context.children`; espande il range con `child.computedMin ?? child.softStartYear` e `child.computedMax ?? child.softEndYear` per ogni figlio |
| **A5** | **Wheel zoom proporzionale** — sostituisce `delta = deltaY < 0 ? ZOOM_FACTOR : 1/ZOOM_FACTOR` con `Math.pow(WHEEL_BASE, -e.deltaY)` dove `WHEEL_BASE ≈ 1.002`; zoom continuo e proporzionale all'entità del gesto |
| **A6** | **Fix drag/click conflict** — nel `pointerdown` handler, aggiunge `if ((e.target as HTMLElement).closest('button')) return;` prima di avviare il drag — i click sui bottoni non triggerano la cattura del pointer |
| **A7** | **Reset button** — `ZoomControls` aggiunge prop `onReset` (o rinomina `onFitToView`); icona sostituita con simbolo "frecce verso l'esterno" (full-extent); tooltip "Mostra tutto"; `fitToView()` già ha animazione da 0.5s |

---

## Fit Check: R × A

| Req | Requisito | Status | A |
|-----|-----------|--------|---|
| R0 | L'asse è al 50% verticale del canvas | Core goal | ✅ |
| R1 | Sub-contesti sopra l'asse, eventi sotto | Must-have | ✅ |
| R2 | Fit-to-viewport include il range dei sub-contesti figli | Must-have | ✅ |
| R3 | Mousewheel zoom proporzionale e fluido | Must-have | ✅ |
| R4 | Bottoni +/− funzionanti (fix drag/click conflict) | Must-have | ✅ |
| R5 | Reset button riconoscibile con animazione | Must-have | ✅ |

**Shape A soddisfa tutti i requisiti.**

---

## File toccati

| File | Cambiamento |
|------|-------------|
| `components/timeline/TimelineCanvas.tsx` | Calcola `axisY`, lo passa come prop; fix wheel zoom (A5); fix drag handler (A6); passa `context.children` a `computeTimelineRange` (A4) |
| `components/timeline/TimelineAxis.tsx` | Accetta prop `axisY` invece di costante |
| `components/timeline/EventMarker.tsx` | Accetta prop `axisY`; invertisce direzione stem/label (verso il basso) |
| `components/timeline/EventCluster.tsx` | Accetta prop `axisY`; invertisce posizione cluster (verso il basso) |
| `components/timeline/SubTimelineBars.tsx` | Accetta prop `axisY`; inverte direzione barre (verso l'alto) |
| `components/timeline/ZoomControls.tsx` | Aggiorna icon e tooltip per reset (A7) |
| `lib/timeline/scale.ts` o `date-utils.ts` | `computeTimelineRange` accetta e include range dei figli (A4) |
