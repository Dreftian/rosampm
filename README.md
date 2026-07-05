# 🌹 RosaMPM

> **Dedicado para ti: Rosa Pinedo <3**

Sitio web interactivo con una rosa animada que florece al hacer scroll. Construido con vanilla JavaScript, Canvas 2D y CSS moderno. Totalmente responsivo y optimizado para todos los dispositivos.

---

## ✨ Características

- 🎬 **Video scroll-driven** — Un video de fondo que avanza cuadro por cuadro al hacer scroll (efecto Apple-style)
- 🌹 **Rosa animada en Canvas** — Dibujada programáticamente con 6 capas de pétalos, tallo, hojas y espiral central
- 📜 **Bloom progresivo** — La rosa florece en 9 etapas conforme el usuario desliza
- 💌 **Dedicatoria poética** — 5 estrofas que se revelan una a una con el scroll
- ✨ **Partículas flotantes** — Sistema de partículas con tonos rosa sutiles
- 🎴 **Cards con glass-morphism** — Tarjetas con efecto vidrio esmerilado y reveal por máscara
- 📱 **100% responsivo** — 5 breakpoints (320px → 4K+), `clamp()`, iOS-safe (`100dvh`)
- ♿ **Accesible** — `prefers-reduced-motion`, `touch-action`, textos con `hyphens`

---

## 🚀 Demo

Abre `index.html` en un servidor local (los módulos ES requieren HTTP):

```bash
# Con Python
python -m http.server 8080

# Con Node.js
npx serve .

# Con VS Code Live Server
# Click derecho en index.html → "Open with Live Server"
```

Luego abre `http://localhost:8080` y **haz scroll** para ver la magia.

---

## 🏗️ Arquitectura

```
RosaMPM/
├── index.html              ← HTML semántico, estructura limpia
├── css/
│   └── styles.css          ← Estilos organizados por sección, responsive
├── js/
│   ├── main.js             ← Punto de entrada, wiring de módulos
│   ├── rose.js             ← 🌹 Rosa Canvas: bloom scroll-driven
│   ├── video-scroll.js     ← 🎬 Video: extracción de frames por scroll
│   ├── sections.js         ← 📜 Scroll master + estrofas + dedicatoria
│   ├── cards.js            ← 🎴 Tarjetas: reveal por máscara
│   └── particles.js        ← ✨ Partículas flotantes
└── README.md
```

### Flujo de datos

```
Scroll del usuario
       │
       ▼
sections.js ── getBloomProgress() ──► rose.js (dibuja la rosa)
       │
       ├── updateDedication() ──────► #dedication (fade-in)
       ├── updateStanzas() ─────────► .stanza (reveal secuencial)
       ├── updateHeroOpacity() ─────► #hero (fade-out)
       └── updateNav() ────────────► nav (glass al scrollear)
```

---

## 🎨 La Rosa — Etapas de Florecimiento

| Scroll | Etapa |
|--------|-------|
| 0–20% | 🌱 Tallo emerge desde abajo |
| 10–28% | 🌿 Hojas se despliegan |
| 18–32% | Sépalos se abren hacia afuera |
| 20–73% | **6 capas de pétalos** (rojo oscuro → rosa claro) |
| 65–80% | 🌸 Espiral central florece |
| 55%+ | ✨ Partículas emanan de la flor |

Cada etapa usa `easeOutCubic` para una transición orgánica y suave.

---

## 📱 Responsive Design

| Breakpoint | Dispositivos |
|------------|-------------|
| ≥ 1025px | Desktop, monitores grandes |
| 769–1024px | Tablet landscape (iPad) |
| 481–768px | Tablet portrait, phones grandes |
| 376–480px | iPhone 6/7/8/SE, Galaxy S |
| 320–375px | iPhone SE (1st gen), pantallas pequeñas |

Todas las dimensiones usan `clamp()` para adaptación fluida sin saltos bruscos.

---

## 🛠️ Tecnologías

- **Vanilla JavaScript** (ES Modules) — Sin frameworks, sin dependencias
- **Canvas 2D API** — Dibujo programático de la rosa
- **CSS Moderno** — `clamp()`, `backdrop-filter`, `100dvh`, `@supports`
- **Google Fonts** — Inter (300–800)

---

## 📄 Licencia

Hecho con ❤️ para Rosa Pinedo.  
Código libre — siéntete libre de usarlo, modificarlo y compartirlo.

---

> *"Rosa, hay nombres que pesan y hay nombres que vuelan. El tuyo flota entre pétalos y recuerdos..."*
