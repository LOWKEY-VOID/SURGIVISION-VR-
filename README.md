# SURGIVISION-VR-

**Immersive Virtual Reality Anatomy & Surgical Training Platform**

SurgiVision VR is a concept website for a next-generation VR medical education platform. It showcases an immersive interface for exploring human anatomy, practicing surgical procedures, and studying Ayurvedic anatomical concepts — all wrapped in an interactive, cyber-themed web experience built with vanilla JS, Three.js, and GSAP.

---

## ✨ Features

- **Interactive 3D Body Systems** — explore anatomical layers through an interactive viewer
- **Ayurveda-Focused Learning** — a dedicated module blending traditional and modern anatomical study
- **Virtual Surgical Training** — a simulated surgical procedure walkthrough
- **Real-Time Knowledge Evaluator** — an in-page quiz system to test understanding
- **Hardware & Software Specs** — an overview section detailing platform/hardware integration
- **WebGL Particle Background** — animated ambient scene powered by Three.js
- **Scroll-Driven Animations** — smooth section transitions via GSAP + ScrollTrigger
- **Custom Cursor & Micro-interactions** — polished, game-like UI feel
- **Fully Responsive** — mobile-friendly navigation and layout

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (custom, `styles.css`) |
| Interactivity | Vanilla JavaScript (`app.js`) |
| 3D / WebGL | [Three.js](https://threejs.org/) |
| Animation | [GSAP](https://gsap.com/) & ScrollTrigger |
| Icons | Font Awesome |
| Fonts | Google Fonts (Inter, Orbitron, Space Grotesk) |

## 📁 Project Structure

```
SURGIVISION-VR-/
├── index.html          # Main landing page (hero, anatomy, ayurveda, surgery, quiz, specs)
├── documentation.html   # Project/product documentation
├── privacy.html         # Privacy policy page
├── app.js               # Core WebGL, animation, and UI controller logic
├── styles.css            # Site-wide styling
├── robots.txt            # Search engine crawl rules
└── README.md
```

## 🚀 Getting Started

This is a static site with no build step required.

```bash
# Clone the repo
git clone https://github.com/LOWKEY-VOID/SURGIVISION-VR-.git
cd SURGIVISION-VR-

# Serve locally (any static server works)
npx serve .
# or
python3 -m http.server 8000
```

Then open `http://localhost:8000` (or the port your server prints) in your browser.

## 🌐 Deployment

The live version is deployed via [Surge](https://surge.sh/). To deploy your own copy:

```bash
npm install -g surge
surge .
```

## 📄 Pages

- `index.html` — main product landing page
- `documentation.html` — platform documentation
- `privacy.html` — privacy policy

## 🤝 Contributing

This is a personal/portfolio project. Suggestions and pull requests are welcome — feel free to open an issue first to discuss what you'd like to change.

## 📜 License

No license specified yet. Add a `LICENSE` file if you'd like to open this project up for reuse (MIT is a common default for portfolio sites).

---

Built by [LOWKEY-VOID](https://github.com/LOWKEY-VOID)
