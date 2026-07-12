/* ==========================================================================
   SurgiVision VR - Core WebGL & Interface Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize Custom Cursor
  initCustomCursor();

  // Initialize Three.js WebGL Particle System
  initThreeJS();

  // Initialize GSAP & ScrollTrigger Animations
  initGSAP();

  // Initialize Interactive UI Modules
  initAnatomyToggles();
  initAyurvedaSlider();
  initSurgicalSimulator();
  initQuizSystem();
  initTerminalFooter();

  // Initialize Navbar Mobile Toggle
  initMobileNav();
});

/* ==========================================================================
   Custom Cursor Logic
   ========================================================================== */
function initCustomCursor() {
  const cursor = document.querySelector('.custom-cursor');
  const follower = document.querySelector('.custom-cursor-follower');
  
  if (!cursor || !follower) return;

  let mouseX = 0;
  let mouseY = 0;
  let followerX = 0;
  let followerY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Position main cursor instantly
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
  });

  // Follower lags behind for kinetic smooth feel
  function animateFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    
    follower.style.left = `${followerX}px`;
    follower.style.top = `${followerY}px`;
    
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  // Hover states
  const interactables = document.querySelectorAll('a, button, input, .layer-btn, .option-btn, .drag-handle, .target-node, .term-btn-shortcut');
  interactables.forEach(item => {
    item.addEventListener('mouseenter', () => {
      cursor.classList.add('hovered');
      follower.classList.add('hovered');
    });
    item.addEventListener('mouseleave', () => {
      cursor.classList.remove('hovered');
      follower.classList.remove('hovered');
    });
  });
}

/* ==========================================================================
   Three.js WebGL Particle Morphing System
   ========================================================================== */
let scene, camera, renderer, particlePoints, particleGeometry;
let numParticles = 2800;

// Coordinate systems for shapes
let shapes = {
  0: [], // DNA Helix
  1: [], // Beating Heart
  2: [], // Synaptic Brain
  3: [], // Surgical Cylinder Grid
  4: [], // Performance Double Globe
  5: []  // Specifications Flat Data Plane
};

let colors = {
  0: [], // DNA Colors (Cyan & Purple)
  1: [], // Heart Colors (Crimson & Pink)
  2: [], // Brain Colors (Electric Blue & Neon Violet)
  3: [], // Grid Colors (Neon Matrix Green)
  4: [], // Globe Colors (Purple & Deep Blue)
  5: []  // Plane Colors (Dark Blue & Light Teal)
};

let activeState = 0;
let mouse3D = new THREE.Vector2();
let targetRotationX = 0;
let targetRotationY = 0;

function initThreeJS() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  // Scene & Camera
  scene = new THREE.Scene();
  
  // Set up camera with responsive field of view
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 8;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Generate coordinates & colors for each state
  generateDNAData();
  generateHeartData();
  generateBrainData();
  generateGridData();
  generateGlobeData();
  generatePlaneData();

  // Create geometry & buffer attributes
  particleGeometry = new THREE.BufferGeometry();
  
  const initialPositions = new Float32Array(numParticles * 3);
  const initialColors = new Float32Array(numParticles * 3);

  // Load DNA values as initial values
  for (let i = 0; i < numParticles * 3; i++) {
    initialPositions[i] = shapes[0][i];
    initialColors[i] = colors[0][i];
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(initialColors, 3));

  // Create standard glowing round particle texture using canvas
  function createParticleTexture() {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pContext = pCanvas.getContext('2d');
    const pGradient = pContext.createRadialGradient(8, 8, 0, 8, 8, 8);
    pGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    pGradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    pGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    pGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pContext.fillStyle = pGradient;
    pContext.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(pCanvas);
  }

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.08,
    map: createParticleTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  // Construct points
  particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particlePoints);

  // Mouse interactivity triggers rotation skew
  window.addEventListener('mousemove', (e) => {
    mouse3D.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse3D.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Resize Handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // Animation Loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    const positions = particleGeometry.attributes.position.array;
    const colorArray = particleGeometry.attributes.color.array;

    const targetPos = shapes[activeState];
    const targetCol = colors[activeState];

    let heartPulseScale = 1.0;
    if (activeState === 1) {
      // Beating heart pulse simulation: double contraction pulse (Lub-Dub)
      const pulseCycle = (time * 4) % (Math.PI * 2);
      if (pulseCycle < Math.PI) {
        heartPulseScale = 1.0 + 0.12 * Math.sin(pulseCycle * 2);
      } else {
        heartPulseScale = 1.0 + 0.05 * Math.sin((pulseCycle - Math.PI) * 2);
      }
    }

    // Lerp positions & colors
    for (let i = 0; i < numParticles; i++) {
      const idx = i * 3;

      let tx = targetPos[idx];
      let ty = targetPos[idx + 1];
      let tz = targetPos[idx + 2];

      // Apply pulsing scale factor to heart geometry
      if (activeState === 1) {
        tx *= heartPulseScale;
        ty *= heartPulseScale;
        tz *= heartPulseScale;
      }

      // Brain synaptic glow signals simulation (increase particle scale dynamically)
      if (activeState === 2 && i % 30 === 0) {
        // Simulating firing action potentials
        const signalIntensity = Math.sin(time * 8 + i) * 0.25 + 0.25;
        tx += (Math.random() - 0.5) * signalIntensity * 0.1;
        ty += (Math.random() - 0.5) * signalIntensity * 0.1;
      }

      // Linear interpolation (lerp) from current position to targeted shape
      positions[idx] += (tx - positions[idx]) * 0.065;
      positions[idx + 1] += (ty - positions[idx + 1]) * 0.065;
      positions[idx + 2] += (tz - positions[idx + 2]) * 0.065;

      // Color lerp
      colorArray[idx] += (targetCol[idx] - colorArray[idx]) * 0.065;
      colorArray[idx + 1] += (targetCol[idx + 1] - colorArray[idx + 1]) * 0.065;
      colorArray[idx + 2] += (targetCol[idx + 2] - colorArray[idx + 2]) * 0.065;
    }

    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;

    // Apply rotations based on activeState
    if (activeState === 0) {
      // Slow rotation for DNA helix
      particlePoints.rotation.y = time * 0.25;
      particlePoints.rotation.x = 0.2;
    } else if (activeState === 1) {
      // Slow heartbeat swing
      particlePoints.rotation.y = Math.sin(time * 0.4) * 0.2;
      particlePoints.rotation.x = 0.1;
    } else if (activeState === 2) {
      // Brain slowly rotates
      particlePoints.rotation.y = time * 0.15;
      particlePoints.rotation.x = Math.sin(time * 0.2) * 0.1;
    } else if (activeState === 3) {
      // Surgical scanner rotates
      particlePoints.rotation.y = time * 0.4;
      particlePoints.rotation.x = 0.3;
    } else if (activeState === 4) {
      // Opposite dual rotations logic handled inside coordinate mapping or here
      particlePoints.rotation.y = time * 0.3;
      particlePoints.rotation.x = -time * 0.1;
    } else if (activeState === 5) {
      // Flat grid responds heavily to mouse movements
      targetRotationY = mouse3D.x * 0.5;
      targetRotationX = -mouse3D.y * 0.5;
      particlePoints.rotation.y += (targetRotationY - particlePoints.rotation.y) * 0.1;
      particlePoints.rotation.x += (targetRotationX - particlePoints.rotation.x) * 0.1;
    }

    // Parallax mouse sway offset
    if (activeState !== 5) {
      particlePoints.position.x += (mouse3D.x * 0.3 - particlePoints.position.x) * 0.05;
      particlePoints.position.y += (mouse3D.y * 0.3 - particlePoints.position.y) * 0.05;
    } else {
      particlePoints.position.x *= 0.95;
      particlePoints.position.y *= 0.95;
    }

    renderer.render(scene, camera);
  }
  
  animate();
}

/* --- Shape Coordinate Generators --- */

// 1. DNA Double Helix
function generateDNAData() {
  const points = [];
  const cols = [];
  const height = 6.0;
  const radius = 1.3;
  const helices = 2;

  for (let i = 0; i < numParticles; i++) {
    // 65% of particles on strands, 35% on connecting base pairs
    if (i < numParticles * 0.65) {
      const strand = i % helices;
      const progress = (i / (numParticles * 0.65));
      const y = progress * height - (height / 2);
      const angle = progress * Math.PI * 8.0 + (strand * Math.PI);
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      points.push(x, y, z);

      // Colors: Cyan for strand 1, Purple for strand 2
      if (strand === 0) {
        cols.push(0.0, 0.95, 1.0); // Cyan
      } else {
        cols.push(0.72, 0.15, 0.99); // Purple
      }
    } else {
      // Connectors / Rungs
      const r = Math.random();
      const progress = Math.random();
      const y = progress * height - (height / 2);
      const angle = progress * Math.PI * 8.0;
      
      // Interpolate between Strand A and Strand B
      const xA = radius * Math.cos(angle);
      const zA = radius * Math.sin(angle);
      const xB = radius * Math.cos(angle + Math.PI);
      const zB = radius * Math.sin(angle + Math.PI);

      const x = THREE.MathUtils.lerp(xA, xB, r);
      const z = THREE.MathUtils.lerp(zA, zB, r);

      points.push(x, y, z);
      
      // Color gradient transition for inner base pairs
      cols.push(
        THREE.MathUtils.lerp(0.0, 0.72, r), 
        THREE.MathUtils.lerp(0.95, 0.15, r), 
        THREE.MathUtils.lerp(1.0, 0.99, r)
      );
    }
  }

  shapes[0] = points;
  colors[0] = cols;
}

// 2. Beating Heart
function generateHeartData() {
  const points = [];
  const cols = [];

  for (let i = 0; i < numParticles; i++) {
    // Math Parametric cardioid shell formula
    const theta = Math.random() * Math.PI * 2.0;
    const phi = (Math.random() - 0.5) * Math.PI;

    // Heart 2D coordinates scaled
    const x = 16.0 * Math.pow(Math.sin(theta), 3);
    const y = 13.0 * Math.cos(theta) - 5.0 * Math.cos(2*theta) - 2.0 * Math.cos(3*theta) - Math.cos(4*theta);
    const z = 8 * Math.sin(phi) * Math.sin(theta); // Give it thickness

    // Scale down and center
    const scale = 0.14;
    points.push(x * scale, (y * scale) + 0.2, z * scale);

    // Color: Blend of crimson red and glowing violet-pink
    const blend = Math.random();
    cols.push(
      THREE.MathUtils.lerp(0.95, 0.5, blend), // Red
      THREE.MathUtils.lerp(0.1, 0.05, blend), // Green
      THREE.MathUtils.lerp(0.2, 0.8, blend)   // Blue
    );
  }

  shapes[1] = points;
  colors[1] = cols;
}

// 3. Synaptic Brain
function generateBrainData() {
  const points = [];
  const cols = [];

  for (let i = 0; i < numParticles; i++) {
    const lobe = Math.random();
    let x, y, z;

    if (lobe < 0.45) {
      // Left Lobe (Ellipsoid cloud with perturbations)
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI;
      x = -0.5 + 1.2 * Math.cos(u) * Math.sin(v);
      y = 0.2 + 0.9 * Math.sin(u) * Math.sin(v);
      z = 0.9 * Math.cos(v);
      
      // Brain convolutions/folds noise emulation
      x += Math.sin(y * 7) * 0.08;
      z += Math.cos(x * 5) * 0.08;
    } else if (lobe < 0.90) {
      // Right Lobe
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI;
      x = 0.5 + 1.2 * Math.cos(u) * Math.sin(v);
      y = 0.2 + 0.9 * Math.sin(u) * Math.sin(v);
      z = 0.9 * Math.cos(v);

      x += Math.sin(y * 7) * 0.08;
      z += Math.cos(x * 5) * 0.08;
    } else {
      // Brain Stem extending down
      const h = Math.random();
      y = -h * 1.5;
      x = (Math.random() - 0.5) * 0.3 * (1.5 - y);
      z = -0.2 + (Math.random() - 0.5) * 0.3 * (1.5 - y);
    }

    // Scale down brain size slightly
    const scale = 1.2;
    points.push(x * scale, y * scale, z * scale);

    // Color: Electric Cyan/Blue for lobes, Deep Magenta for stem
    if (lobe < 0.90) {
      if (Math.random() > 0.8) {
        cols.push(0.0, 0.9, 1.0); // Synaptic spark cyan
      } else {
        cols.push(0.1, 0.3, 0.9); // Deep neural blue
      }
    } else {
      cols.push(0.65, 0.1, 0.8); // Stem violet
    }
  }

  shapes[2] = points;
  colors[2] = cols;
}

// 4. Surgical Grid
function generateGridData() {
  const points = [];
  const cols = [];

  for (let i = 0; i < numParticles; i++) {
    // Generate a futuristic cylinder mesh mapping
    // Stack multiple concentric rings and scanning bars
    const layer = i % 8;
    const progress = Math.random();
    const angle = progress * Math.PI * 2.0;
    
    let x, y, z;
    const radius = 1.6;

    if (layer < 5) {
      // Concentric structural rings
      const ringHeight = -1.8 + (layer * 0.9);
      x = radius * Math.cos(angle);
      y = ringHeight;
      z = radius * Math.sin(angle);
    } else {
      // Vertical grid support beams
      const supportIdx = i % 12;
      const supportAngle = (supportIdx / 12) * Math.PI * 2;
      x = radius * Math.cos(supportAngle);
      y = (progress * 4.0) - 2.0;
      z = radius * Math.sin(supportAngle);
    }

    // Perturb grid points occasionally to look scan-like
    if (Math.random() > 0.95) {
      x += (Math.random() - 0.5) * 0.8;
      z += (Math.random() - 0.5) * 0.8;
    }

    points.push(x, y, z);
    
    // Glowing laser matrix green colors
    if (Math.random() > 0.9) {
      cols.push(0.0, 0.95, 1.0); // High tech cyan node
    } else {
      cols.push(0.06, 0.72, 0.5); // Surgical matrix green
    }
  }

  shapes[3] = points;
  colors[3] = cols;
}

// 5. Performance Globe
function generateGlobeData() {
  const points = [];
  const cols = [];

  for (let i = 0; i < numParticles; i++) {
    // Double orbiting globe shells
    const outerShell = i < numParticles * 0.6;
    const radius = outerShell ? 2.0 : 1.1;

    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI;

    const x = radius * Math.cos(u) * Math.sin(v);
    const y = radius * Math.sin(u) * Math.sin(v);
    const z = radius * Math.cos(v);

    points.push(x, y, z);

    if (outerShell) {
      cols.push(0.5, 0.1, 0.9); // Purple outer shell
    } else {
      cols.push(0.0, 0.8, 0.9); // Cyan inner core
    }
  }

  shapes[4] = points;
  colors[4] = cols;
}

// 6. Specifications Plane
function generatePlaneData() {
  const points = [];
  const cols = [];

  for (let i = 0; i < numParticles; i++) {
    // Generate a flat holographic grid plane tilting in space
    const colsCount = Math.floor(Math.sqrt(numParticles));
    const rIdx = i % colsCount;
    const cIdx = Math.floor(i / colsCount);

    const x = ((rIdx / colsCount) - 0.5) * 6.5;
    const z = ((cIdx / colsCount) - 0.5) * 6.5;
    
    // Wave ripple patterns in flat plane
    const dist = Math.sqrt(x*x + z*z);
    const y = -1.2 + Math.sin(dist * 2.0) * 0.15;

    points.push(x, y, z);

    // Color gradient across the grid sheet
    const gradientVal = (x + 3.25) / 6.5;
    cols.push(
      THREE.MathUtils.lerp(0.0, 0.5, gradientVal), // R
      THREE.MathUtils.lerp(0.7, 0.1, gradientVal), // G
      THREE.MathUtils.lerp(0.9, 0.8, gradientVal)  // B
    );
  }

  shapes[5] = points;
  colors[5] = cols;
}


/* ==========================================================================
   GSAP Section & Navigation Animations
   ========================================================================== */
function initGSAP() {
  // Register GSAP ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  const sections = gsap.utils.toArray('.section');
  const navLinks = document.querySelectorAll('.nav-links a');

  sections.forEach((section, idx) => {
    // Trigger coordinate morph based on section enter/leaves
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: self => {
        if (self.isActive) {
          activeState = idx;
          
          // Reset visualizer positions slightly to give entry bump feel
          if (particlePoints) {
            gsap.fromTo(particlePoints.scale, 
              { x: 0.85, y: 0.85, z: 0.85 }, 
              { x: 1.0, y: 1.0, z: 1.0, duration: 1.2, ease: 'power2.out' }
            );
          }

          // Update navigation highlighted link
          navLinks.forEach(link => link.classList.remove('active'));
          const activeLink = document.querySelector(`.nav-links a[href="#${section.id}"]`);
          if (activeLink) activeLink.classList.add('active');

          // Highlight/Log connection terminal state
          const terminalBody = document.getElementById('term-body');
          if (terminalBody) {
            const entryLines = {
              0: "Core terminal: Mode shifted to DNA Base Helix.",
              1: "Core terminal: Mode shifted to Heart Anatomy layers.",
              2: "Core terminal: Mode shifted to Ayurveda correlations & Marma grids.",
              3: "Core terminal: Mode shifted to Appendectomy surgical coordinates.",
              4: "Core terminal: Mode shifted to assessment scores dual globe.",
              5: "Core terminal: Mode shifted to flat dashboard parameter matrix."
            };
            logTerminal(entryLines[idx], 'output');
          }
        }
      }
    });

    // Content reveals on Scroll
    const revealElements = section.querySelectorAll('[data-gsap="fade-up"], [data-gsap="fade-right"], [data-gsap="fade-left"]');
    revealElements.forEach(el => {
      let animProps = {
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      };

      if (el.dataset.gsap === 'fade-up') {
        animProps.y = 40;
      } else if (el.dataset.gsap === 'fade-right') {
        animProps.x = -60;
      } else if (el.dataset.gsap === 'fade-left') {
        animProps.x = 60;
      }

      gsap.from(el, animProps);
    });
  });

  // Ticking telemetry numbers in Hero
  const accuracyText = document.getElementById('tel-accuracy');
  const indepText = document.getElementById('tel-independence');
  
  if (accuracyText) {
    let accVal = { val: 1.5 };
    gsap.to(accVal, {
      val: 0.18,
      duration: 3,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top center'
      },
      onUpdate: () => {
        accuracyText.textContent = `< ${accVal.val.toFixed(2)}mm`;
      }
    });
  }

  if (indepText) {
    let indVal = { val: 20.0 };
    gsap.to(indVal, {
      val: 94.8,
      duration: 3,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top center'
      },
      onUpdate: () => {
        indepText.textContent = `${indVal.val.toFixed(1)}%`;
      }
    });
  }
}

/* ==========================================================================
   Anatomy Exploration Layers Control
   ========================================================================== */
function initAnatomyToggles() {
  const layerButtons = document.querySelectorAll('.layer-btn');
  const organTitle = document.getElementById('anatomy-organ-name');
  
  // Tabs selectors inside the details card
  const tabModernBtn = document.getElementById('tab-modern-btn');
  const tabAyurBtn = document.getElementById('tab-ayur-btn');
  const tabModernContent = document.getElementById('tab-modern-content');
  const tabAyurContent = document.getElementById('tab-ayur-content');

  // Layer detail content sets
  const layerDetails = {
    skeletal: {
      title: "Organ Study: Bone Lattice (Asthi)",
      modern: `
        <p><strong>Function:</strong> Structural framework of the body. Protects internal organs and facilitates locomotion.</p>
        <p><strong>Cellular Grid:</strong> Osteocyte meshwork and calcium phosphate crystals.</p>
        <p><strong>Vascularity:</strong> Haversian canals containing nutrient arteries.</p>
      `,
      ayurveda: `
        <p><strong>Sanskrit Term:</strong> Asthi Dhatu (अस्थि धातु) - The skeletal tissue giving firm structure (Dharana) to body layers.</p>
        <p><strong>Dosha Relation:</strong> Main location of Vata Dosha. An imbalance causes bones to become porous (Asthi-saushirya).</p>
        <p><strong>Clinical Note:</strong> Connected to hair and nails (Malas) and joint stability (Sandhi).</p>
      `
    },
    muscular: {
      title: "Organ Study: Skeletal Muscle (Mamsa)",
      modern: `
        <p><strong>Function:</strong> Generates force and movement. Maintains posture and body temperature.</p>
        <p><strong>Innervation:</strong> Somatic motor nerves activating myofibrils.</p>
        <p><strong>Blood Supply:</strong> Heavy capillary flow supplying oxygenated hemoglobin.</p>
      `,
      ayurveda: `
        <p><strong>Sanskrit Term:</strong> Mamsa Dhatu (मांस धातु) - Muscle tissue responsible for Lepana (plastering/covering skeletal structures).</p>
        <p><strong>Dosha Relation:</strong> Dominated by Kapha Dosha, providing strength, physical bulk, and courage.</p>
        <p><strong>Anatomy Reference:</strong> Composed of Snayu (tendons) and Peshi (muscle units).</p>
      `
    },
    nervous: {
      title: "Organ Study: Neuronal Path (Majja/Vata)",
      modern: `
        <p><strong>Function:</strong> Directs sensory stimuli and cognitive commands via electrochemical action potentials.</p>
        <p><strong>Pathways:</strong> Myelinated axons, spinal cord nodes, cerebral lobes.</p>
        <p><strong>Synaptic Speed:</strong> Signal transmissions up to 120 meters per second.</p>
      `,
      ayurveda: `
        <p><strong>Sanskrit Term:</strong> Majja Dhatu & Mastishka (मज्जा और मस्तिष्क) - Nerve tissue filling bone cavities and seat of sensory control.</p>
        <p><strong>Dosha Relation:</strong> Primarily governed by Prana Vata (sensory impulses) and Sadhaka Pitta (intelligence processing).</p>
        <p><strong>Marma Links:</strong> Intricately connected to head Marmas like Shringataka and Adhipati.</p>
      `
    },
    cardiovascular: {
      title: "Organ Study: Heart (Hridaya)",
      modern: `
        <p><strong>Function:</strong> Muscular organ that pumps blood through the blood vessels of the circulatory system. Provides oxygen and nutrients to tissues.</p>
        <p><strong>Nerve Supply:</strong> Vagus nerve (parasympathetic) and sympathetic trunk.</p>
        <p><strong>Blood Supply:</strong> Coronary arteries branching from the ascending aorta.</p>
      `,
      ayurveda: `
        <p><strong>Sanskrit Term:</strong> Hridaya (हृदय) - The seat of Chetana (consciousness) and Ojas (vital energy essence).</p>
        <p><strong>Dosha Relation:</strong> Seat of Vyana Vayu (governs circulation) and Sadhaka Pitta (governs courage and emotions).</p>
        <p><strong>Marma Significance:</strong> One of the three Mahamarmas (vital nodes). Injury is fatal.</p>
      `
    },
    respiratory: {
      title: "Organ Study: Lungs (Phupphusa)",
      modern: `
        <p><strong>Function:</strong> Performs external respiration: exchanging oxygen and carbon dioxide across alveolar-capillary membranes.</p>
        <p><strong>Innervation:</strong> Pulmonary plexus (Vagus and sympathetic).</p>
        <p><strong>Volume Capacity:</strong> Tidal volume ~500mL, Total capacity ~6000mL.</p>
      `,
      ayurveda: `
        <p><strong>Sanskrit Term:</strong> Phupphusa (फुफ्फुस) - The lung structures located on the left and right chest cavity.</p>
        <p><strong>Srotas Link:</strong> Core organ of Pranavaha Srotas (oxygen channels). Strongly related to Udana Vayu (speech/exhalation).</p>
        <p><strong>Dosha Links:</strong> Susceptible to Kapha congestion (causes breathing anomalies like Shwasa).</p>
      `
    },
    digestive: {
      title: "Organ Study: Stomach (Amashaya)",
      modern: `
        <p><strong>Function:</strong> Temporary storage and mechanical/chemical breakdown of food using hydrochloric acid and pepsin.</p>
        <p><strong>Sphincters:</strong> Cardiac (upper) and pyloric (lower) valves.</p>
        <p><strong>Vascular Supply:</strong> Gastric arteries from the celiac trunk.</p>
      `,
      ayurveda: `
        <p><strong>Sanskrit Term:</strong> Amashaya (आमाशय) - The stomach, which is the primary site of digestion.</p>
        <p><strong>Agni & Pitta:</strong> The seat of Pachaka Pitta (digestive enzymes) and Kledaka Kapha (stomach mucus protecting lining).</p>
        <p><strong>Digestive Stage:</strong> Site of primary Madhura Avasthapaka (sweet digestion phase).</p>
      `
    }
  };

  layerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      layerButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const layer = btn.dataset.layer;
      const data = layerDetails[layer];

      // Update card details
      if (organTitle && data) {
        organTitle.textContent = data.title;
        if (tabModernContent) tabModernContent.innerHTML = data.modern;
        if (tabAyurContent) tabAyurContent.innerHTML = data.ayurveda;
      }

      // Morph particle behavior based on active layer to simulate systems:
      if (particleGeometry) {
        const colsArray = colors[1]; // Heart state color template
        const positions = particleGeometry.attributes.position.array;

        // Custom palette adjustments per system
        for (let i = 0; i < numParticles; i++) {
          const idx = i * 3;
          if (layer === 'skeletal') {
            // White bone-like grey
            colsArray[idx] = 0.75;
            colsArray[idx+1] = 0.78;
            colsArray[idx+2] = 0.8;
          } else if (layer === 'muscular') {
            // Crimson muscular red
            colsArray[idx] = 0.95;
            colsArray[idx+1] = 0.15;
            colsArray[idx+2] = 0.22;
          } else if (layer === 'nervous') {
            // Electric glowing blue
            colsArray[idx] = 0.0;
            colsArray[idx+1] = 0.9;
            colsArray[idx+2] = 1.0;
          } else if (layer === 'cardiovascular') {
            // Hot red/cyan balance
            if (i % 2 === 0) {
              colsArray[idx] = 0.95; colsArray[idx+1] = 0.1; colsArray[idx+2] = 0.2;
            } else {
              colsArray[idx] = 0.1; colsArray[idx+1] = 0.3; colsArray[idx+2] = 0.95;
            }
          } else if (layer === 'respiratory') {
            // Teal/windy cyan
            colsArray[idx] = 0.1;
            colsArray[idx+1] = 0.85;
            colsArray[idx+2] = 0.8;
          } else if (layer === 'digestive') {
            // Gold stomach yellow
            colsArray[idx] = 0.85;
            colsArray[idx+1] = 0.65;
            colsArray[idx+2] = 0.1;
          }
        }
        particleGeometry.attributes.color.needsUpdate = true;
      }

      logTerminal(`Anatomy Explorer: Switched visualization to ${layer.toUpperCase()} database.`, 'output');
    });
  });

  // Tab switching clicks
  if (tabModernBtn && tabAyurBtn) {
    tabModernBtn.addEventListener('click', () => {
      tabModernBtn.classList.add('active');
      tabAyurBtn.classList.remove('active');
      tabModernContent.classList.remove('hidden');
      tabAyurContent.classList.add('hidden');
    });

    tabAyurBtn.addEventListener('click', () => {
      tabAyurBtn.classList.add('active');
      tabModernBtn.classList.remove('active');
      tabAyurContent.classList.remove('hidden');
      tabModernContent.classList.add('hidden');
    });
  }
}

/* ==========================================================================
   Ayurveda Anatomy Correlation Slider
   ========================================================================== */
function initAyurvedaSlider() {
  const slider = document.getElementById('ayur-slider');
  const modVal = document.querySelector('#modern-display .display-val');
  const modDet = document.querySelector('#modern-display .display-detail');
  const ayurVal = document.querySelector('#ayur-display .display-val');
  const ayurDet = document.querySelector('#ayur-display .display-detail');

  if (!slider) return;

  const dataset = [
    {
      min: 0, max: 25,
      modernVal: "Brain (Cerebrum)",
      modernDet: "Central nervous system command center. Coordinates mental cognitive processes, sensory analysis, and motor pathways.",
      ayurVal: "Mastishka (मस्तिष्क)",
      ayurDet: "The seat of Prana Vayu (sensory controls) and Tarpaka Kapha (spinal fluids and emotional grounding). Integrates somatic impulses."
    },
    {
      min: 26, max: 50,
      modernVal: "Heart (Myocardium)",
      modernDet: "Four-chambered muscle pumping oxygenated blood to somatic vessels. Governed by pacemaker nodes.",
      ayurVal: "Hridaya (हृदय)",
      ayurDet: "Seat of Ojas (primal life-force), Vyana Vayu (circulation/pulse), and Sadhaka Pitta (responsible for courage, logic, and feelings)."
    },
    {
      min: 51, max: 75,
      modernVal: "Kidneys (Renal Lobe)",
      modernDet: "Bilateral retroperitoneal organs filtering blood toxins, regulating fluid pressure, and producing urine volume.",
      ayurVal: "Vrikka (वृक्क)",
      ayurDet: "Organs formed from Medas (fat) and Rakta (blood) essences. Regulates fluid balance (Ambovaha Srotas) and metabolic excretions."
    },
    {
      min: 76, max: 100,
      modernVal: "Lungs (Pulmonary Lobes)",
      modernDet: "Bilateral respiratory gas-exchange structures containing alveoli capillaries. Absorbs O2 and expels CO2 waste.",
      ayurVal: "Phupphusa (फुफ्फुस)",
      ayurDet: "Spongy organs originating from blood froth. Controls Pranavaha Srotas (breath pathways) and houses Udana Vayu (exhalation force)."
    }
  ];

  slider.addEventListener('input', () => {
    const val = parseInt(slider.value);
    
    // Find matching range data
    const matched = dataset.find(item => val >= item.min && val <= item.max);
    
    if (matched && modVal && modDet && ayurVal && ayurDet) {
      modVal.textContent = matched.modernVal;
      modDet.textContent = matched.modernDet;
      ayurVal.textContent = matched.ayurVal;
      ayurDet.textContent = matched.ayurDet;
    }

    // Trigger subtle noise flash in WebGL brain state based on slider motion
    if (activeState === 2 && particleGeometry) {
      const positions = particleGeometry.attributes.position.array;
      for (let i = 0; i < numParticles; i++) {
        if (i % 25 === 0) {
          positions[i*3] += (Math.random() - 0.5) * 0.15;
          positions[i*3 + 2] += (Math.random() - 0.5) * 0.15;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;
    }
  });
}

/* ==========================================================================
   Surgical Simulator Module
   ========================================================================== */
function initSurgicalSimulator() {
  // Console Elements
  const accuracyText = document.getElementById('surg-acc-val');
  const restartBtn = document.getElementById('btn-restart-sim');
  
  // Steps Indicators
  const stepIncise = document.getElementById('step-incise');
  const stepExpose = document.getElementById('step-expose');
  const stepClamp = document.getElementById('step-clamp');

  // Tools Selection Buttons
  const toolScalpel = document.getElementById('tool-scalpel');
  const toolRetractor = document.getElementById('tool-retractor');
  const toolClamp = document.getElementById('tool-clamp');

  // Stage Viewscreen Screens
  const stageStep1 = document.getElementById('stage-step-1');
  const stageStep2 = document.getElementById('stage-step-2');
  const stageStep3 = document.getElementById('stage-step-3');
  const stageComplete = document.getElementById('stage-complete');

  // Step 1: Incision Drag and drop variables
  const scalpelHandle = document.getElementById('scalpel-handle');
  const incisionLine = document.getElementById('incision-line');
  
  // Step 2: Retractor elements
  const tissueLeft = document.getElementById('tissue-left');
  const tissueRight = document.getElementById('tissue-right');
  const appendixTarget = document.getElementById('appendix-target');

  // Step 3: Clamp points
  const clampPoint1 = document.getElementById('clamp-point-1');
  const clampPoint2 = document.getElementById('clamp-point-2');

  let currentStageStep = 1;
  let surgicalAccuracy = 100;
  let baseAccuracyDeduction = 0;

  // Make sure we have the components before binding
  if (!scalpelHandle || !incisionLine) return;

  // --- Step 1: Scalpel Incision Drag Logic ---
  let isDraggingScalpel = false;
  let incisionProgress = 0;

  scalpelHandle.addEventListener('mousedown', startIncision);
  scalpelHandle.addEventListener('touchstart', startIncision);

  window.addEventListener('mousemove', dragIncision);
  window.addEventListener('touchmove', dragIncision);

  window.addEventListener('mouseup', stopIncision);
  window.addEventListener('touchend', stopIncision);

  function startIncision(e) {
    if (currentStageStep !== 1) return;
    isDraggingScalpel = true;
    scalpelHandle.style.cursor = 'grabbing';
    logTerminal("Surgical Sim: Incision initialized at McBurney's Point.", 'input');
  }

  function dragIncision(e) {
    if (!isDraggingScalpel) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = incisionLine.getBoundingClientRect();
    
    // Calculate percentage offset inside the incision line track
    let offsetPercent = ((clientX - rect.left) / rect.width) * 100;
    offsetPercent = Math.max(0, Math.min(offsetPercent, 100));

    // Ensure the drag is progressive (cannot jump back and forth erratically)
    if (offsetPercent >= incisionProgress && offsetPercent <= incisionProgress + 25) {
      incisionProgress = offsetPercent;
      scalpelHandle.style.left = `${incisionProgress}%`;
      
      // Update visual indicator
      incisionLine.style.background = `linear-gradient(to right, #ef4444 ${incisionProgress}%, rgba(0, 242, 254, 0.1) ${incisionProgress}%)`;
      
      // Keep track of accuracy based on deviations
      const dragY = e.touches ? e.touches[0].clientY : e.clientY;
      const centerY = rect.top + rect.height / 2;
      const devY = Math.abs(dragY - centerY);
      
      if (devY > 20) {
        baseAccuracyDeduction += 0.2;
        surgicalAccuracy = Math.max(70, Math.floor(100 - baseAccuracyDeduction));
        accuracyText.textContent = `${surgicalAccuracy}%`;
        accuracyText.style.color = '#ef4444';
      } else {
        accuracyText.style.color = '#00f2fe';
      }

      if (incisionProgress >= 98) {
        completeStep1();
      }
    }
  }

  function stopIncision() {
    isDraggingScalpel = false;
    scalpelHandle.style.cursor = 'grab';
  }

  function completeStep1() {
    isDraggingScalpel = false;
    currentStageStep = 2;

    // Update Steps Indicators in UI
    stepIncise.classList.remove('active');
    stepIncise.classList.add('complete');
    stepIncise.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-check"></i>';

    stepExpose.classList.add('active');
    stepExpose.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    // Enable Tool 2
    toolScalpel.classList.remove('active');
    toolScalpel.disabled = true;
    toolRetractor.disabled = false;
    toolRetractor.classList.add('active');

    // Show Stage 2 Screen
    stageStep1.classList.add('hidden');
    stageStep2.classList.remove('stage-content');
    stageStep2.classList.remove('hidden');
    stageStep2.classList.add('stage-content');

    logTerminal("Surgical Sim: Incision complete. Abdominal wall exposed. Switch to retractors.", "output");
  }

  // --- Step 2: Retractor Tissue Slide Logic ---
  let isRetracting = false;

  stageStep2.addEventListener('mousedown', () => {
    if (currentStageStep !== 2) return;
    isRetracting = true;
    
    // Slide tissues apart
    tissueLeft.style.transform = 'translateX(-80%)';
    tissueRight.style.transform = 'translateX(80%)';

    logTerminal("Surgical Sim: Retracting abdominal layers. Isolating tissue margins.", "input");
  });

  appendixTarget.addEventListener('click', () => {
    if (currentStageStep !== 2 || !isRetracting) return;
    
    // Clicking exposed appendix targets next step
    completeStep2();
  });

  function completeStep2() {
    isRetracting = false;
    currentStageStep = 3;

    // Update Steps
    stepExpose.classList.remove('active');
    stepExpose.classList.add('complete');
    stepExpose.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-check"></i>';

    stepClamp.classList.add('active');
    stepClamp.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    // Enable Tool 3
    toolRetractor.classList.remove('active');
    toolRetractor.disabled = true;
    toolClamp.disabled = false;
    toolClamp.classList.add('active');

    // Show Stage 3
    stageStep2.classList.add('hidden');
    stageStep3.classList.remove('hidden');
    stageStep3.classList.add('stage-content');

    // Glow ligation points
    clampPoint1.classList.add('glow');
    clampPoint2.classList.add('glow');

    logTerminal("Surgical Sim: Appendiceal base exposed. Prepare to ligate and clamp.", "output");
  }

  // --- Step 3: Clamp Ligation Points ---
  let clamp1Selected = false;
  let clamp2Selected = false;

  clampPoint1.addEventListener('click', () => {
    if (currentStageStep !== 3) return;
    clamp1Selected = true;
    clampPoint1.classList.remove('glow');
    clampPoint1.classList.add('clamped');
    
    logTerminal("Surgical Sim: Proximial clamp placed on appendiceal base.", "input");
    checkClampsComplete();
  });

  clampPoint2.addEventListener('click', () => {
    if (currentStageStep !== 3) return;
    clamp2Selected = true;
    clampPoint2.classList.remove('glow');
    clampPoint2.classList.add('clamped');

    logTerminal("Surgical Sim: Distal clamp locked. Section ready for surgical dissection.", "input");
    checkClampsComplete();
  });

  function checkClampsComplete() {
    if (clamp1Selected && clamp2Selected) {
      completeStep3();
    }
  }

  function completeStep3() {
    currentStageStep = 4;
    
    // Mark last step complete
    stepClamp.classList.remove('active');
    stepClamp.classList.add('complete');
    stepClamp.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-check"></i>';

    toolClamp.classList.remove('active');
    toolClamp.disabled = true;

    // Show success viewscreen
    stageStep3.classList.add('hidden');
    stageComplete.classList.remove('hidden');
    stageComplete.classList.add('stage-content');

    logTerminal(`Surgical Sim: Appendectomy completed successfully. Evaluation score generated. Accuracy: ${surgicalAccuracy}%.`, "output");
  }

  // --- Restart Simulator ---
  restartBtn.addEventListener('click', resetSim);
  if (document.getElementById('btn-restart-sim')) {
    document.getElementById('btn-restart-sim').addEventListener('click', resetSim);
  }

  function resetSim() {
    currentStageStep = 1;
    surgicalAccuracy = 100;
    baseAccuracyDeduction = 0;
    incisionProgress = 0;
    clamp1Selected = false;
    clamp2Selected = false;

    accuracyText.textContent = '100%';
    accuracyText.style.color = '#00f2fe';

    // Reset steps indicators
    stepIncise.className = 'sim-step active';
    stepIncise.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    stepExpose.className = 'sim-step';
    stepExpose.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-lock"></i>';
    stepClamp.className = 'sim-step';
    stepClamp.querySelector('.step-status').innerHTML = '<i class="fa-solid fa-lock"></i>';

    // Reset tools
    toolScalpel.disabled = false;
    toolScalpel.className = 'tool-btn active';
    toolRetractor.disabled = true;
    toolRetractor.className = 'tool-btn';
    toolClamp.disabled = true;
    toolClamp.className = 'tool-btn';

    // Reset viewscreens
    stageStep1.classList.remove('hidden');
    stageStep2.className = 'stage-content hidden';
    stageStep3.className = 'stage-content hidden';
    stageComplete.className = 'stage-content hidden';

    // Reset elements positions
    scalpelHandle.style.left = '0%';
    incisionLine.style.background = 'rgba(0, 242, 254, 0.1)';
    tissueLeft.style.transform = 'translateX(0%)';
    tissueRight.style.transform = 'translateX(0%)';
    clampPoint1.className = 'target-node';
    clampPoint2.className = 'target-node';

    logTerminal("Surgical Sim: Restarted appendectomy procedure sandbox module.", "output");
  }
}

/* ==========================================================================
   Educational Assessment Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizData = [
    {
      category: "MODERN CARDIOLOGY",
      question: "Which blood vessel is the primary supplier of oxygenated blood to the cardiac myocardium?",
      options: [
        { text: "A) Pulmonary Artery", correct: false },
        { text: "B) Coronary Artery", correct: true },
        { text: "C) Subclavian Artery", correct: false },
        { text: "D) Jugular Artery", correct: false }
      ]
    },
    {
      category: "AYURVEDIC ANATOMY",
      question: "Under Ayurvedic terminology, Hridaya (the heart) is characterized as one of the three principal _________.",
      options: [
        { text: "A) Agnis (Digestive fires)", correct: false },
        { text: "B) Mahamarmas (Vital anatomical nodes)", correct: true },
        { text: "C) Malas (Waste excretions)", correct: false },
        { text: "D) Srotas (Micro-capillary ducts)", correct: false }
      ]
    },
    {
      category: "SURGICAL PROCEDURES",
      question: "For an appendectomy incision, what is the anatomical landmark used to locate the incision zone?",
      options: [
        { text: "A) McBurney's Point", correct: true },
        { text: "B) Linea Alba", correct: false },
        { text: "C) Iliac Crest Junction", correct: false },
        { text: "D) Umbilical Ring", correct: false }
      ]
    },
    {
      category: "AYURVEDIC PHYSIOLOGY",
      question: "Which of the sub-doshas is traditionally situated in the Mastishka (Brain) and regulates sensory perceptions?",
      options: [
        { text: "A) Sadhaka Pitta", correct: false },
        { text: "B) Tarpaka Kapha & Prana Vayu", correct: true },
        { text: "C) Samana Vayu", correct: false },
        { text: "D) Vyana Vayu", correct: false }
      ]
    }
  ];

  let currentQuestionIdx = 0;
  let quizScore = 0;

  const quizProgressBar = document.getElementById('quiz-progress');
  const quizNumberText = document.getElementById('quiz-number');
  const quizCategoryText = document.getElementById('quiz-category');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsBox = document.getElementById('quiz-options-box');

  const quizCard = document.getElementById('quiz-card');
  const quizResults = document.getElementById('quiz-results');
  
  const scorePercentText = document.getElementById('quiz-score-percent');
  const scoreCircle = document.getElementById('quiz-score-circle');
  const scoreTextVal = document.getElementById('score-text');
  const scoreComment = document.getElementById('quiz-comment-text');
  
  const fillSpatial = document.getElementById('fill-spatial');
  const fillAyur = document.getElementById('fill-ayur');
  const restartQuizBtn = document.getElementById('btn-restart-quiz');

  if (!quizQuestionText) return;

  function loadQuestion() {
    if (currentQuestionIdx >= quizData.length) {
      showResults();
      return;
    }

    const q = quizData[currentQuestionIdx];
    
    // Update progress
    const progressPercent = ((currentQuestionIdx + 1) / quizData.length) * 100;
    quizProgressBar.style.width = `${progressPercent}%`;

    // Update text content
    quizNumberText.textContent = `Question ${currentQuestionIdx + 1} of ${quizData.length}`;
    quizCategoryText.textContent = q.category;
    quizQuestionText.textContent = q.question;

    // Generate options buttons
    quizOptionsBox.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => checkAnswer(btn, opt.correct));
      quizOptionsBox.appendChild(btn);
    });
  }

  function checkAnswer(selectedBtn, isCorrect) {
    const buttons = quizOptionsBox.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true); // Disable further clicks

    if (isCorrect) {
      selectedBtn.classList.add('correct');
      quizScore++;
      logTerminal(`Assessment: Question ${currentQuestionIdx+1} - Correct response selected.`, 'output');
    } else {
      selectedBtn.classList.add('incorrect');
      // Highlight correct answer
      buttons.forEach(btn => {
        // Match standard indexes
        const match = quizData[currentQuestionIdx].options.find(o => btn.textContent.includes(o.text.substring(0,2)));
        if (match && match.correct) {
          btn.classList.add('correct');
        }
      });
      logTerminal(`Assessment: Question ${currentQuestionIdx+1} - Incorrect response selected.`, 'error');
    }

    // Auto load next question after short delay
    setTimeout(() => {
      currentQuestionIdx++;
      loadQuestion();
    }, 1600);
  }

  function showResults() {
    quizCard.classList.add('hidden');
    quizResults.classList.remove('hidden');

    const percent = Math.floor((quizScore / quizData.length) * 100);
    scorePercentText.textContent = `${percent}%`;
    scoreTextVal.textContent = `${quizScore} out of ${quizData.length}`;

    // Update SVG Circle path length: stroke-dasharray="percent, 100"
    scoreCircle.setAttribute('stroke-dasharray', `${percent}, 100`);

    // Set custom comments based on performance
    if (percent === 100) {
      scoreComment.textContent = "Outstanding! Comprehensive understanding of modern surgical pathways and Ayurvedic anatomy.";
      scoreComment.style.color = '#10b981';
      fillSpatial.style.width = '100%';
      fillAyur.style.width = '100%';
    } else if (percent >= 75) {
      scoreComment.textContent = "Excellent clinical knowledge. Solid grasp of spatial relations and core concepts.";
      fillSpatial.style.width = '85%';
      fillAyur.style.width = '75%';
    } else if (percent >= 50) {
      scoreComment.textContent = "Passable marks. Review surgical checklists and Marma correlations.";
      fillSpatial.style.width = '60%';
      fillAyur.style.width = '55%';
    } else {
      scoreComment.textContent = "Needs clinical review. Rerun anatomy exploration and try simulation again.";
      scoreComment.style.color = '#ef4444';
      fillSpatial.style.width = '35%';
      fillAyur.style.width = '30%';
    }

    logTerminal(`Assessment System: Completed. Final Score: ${percent}%.`, 'output');
  }

  restartQuizBtn.addEventListener('click', () => {
    currentQuestionIdx = 0;
    quizScore = 0;
    
    quizCard.classList.remove('hidden');
    quizResults.classList.add('hidden');
    
    loadQuestion();
    logTerminal("Assessment System: Reset. Initializing question sets.", "output");
  });

  // Load first question on launch
  loadQuestion();
}

/* ==========================================================================
   CLI Command Terminal Footer Logic
   ========================================================================== */
function initTerminalFooter() {
  const termBody = document.getElementById('term-body');
  const termInput = document.getElementById('terminal-input');
  const termShortcuts = document.querySelectorAll('.term-btn-shortcut');

  if (!termBody || !termInput) return;

  // Listen for Enter key
  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = termInput.value.trim();
      termInput.value = '';
      if (cmd) executeCommand(cmd);
    }
  });

  // Listen for shortcut buttons clicks
  termShortcuts.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      if (cmd) executeCommand(cmd);
    });
  });
}

function logTerminal(text, type = 'output') {
  const termBody = document.getElementById('term-body');
  if (!termBody) return;

  const line = document.createElement('div');
  line.className = `term-line ${type}`;

  if (type === 'input') {
    line.innerHTML = `<span class="terminal-prompt">&gt;</span> ${text}`;
  } else {
    line.textContent = text;
  }

  termBody.appendChild(line);
  
  // Auto scroll to bottom
  termBody.scrollTop = termBody.scrollHeight;
}

function executeCommand(cmd) {
  // Log the typed input line
  logTerminal(cmd, 'input');

  const cleanCmd = cmd.toLowerCase().trim();

  // Simple command parser
  if (cleanCmd === '/help') {
    logTerminal("Available Core Commands:", "output");
    logTerminal("  /about              - Project overview, goals, and target users.", "output");
    logTerminal("  /ayurveda           - Explain Ayurvedic terminologies and Marma integration.", "output");
    logTerminal("  /sim_status         - Interrogate state of surgical sandbox module.", "output");
    logTerminal("  /connect_institute  - Connect your institution to SurgiVision.", "output");
    logTerminal("  /clear              - Wipe terminal logs screen.", "output");
  } 
  else if (cleanCmd === '/about') {
    logTerminal("--- SURGIVISION VR PROJECT OVERVIEW ---", "output");
    logTerminal("Goal: Revolutionize medical learning and surgical training via high-fidelity, interactive VR systems.", "output");
    logTerminal("Core Systems: Anatomy layers exploration, interactive organ studies, and risk-free surgical simulations.", "output");
    logTerminal("Target Users: MBBS, BDS, Nursing, Physiotherapy, and Ayurveda students & professors.", "output");
  } 
  else if (cleanCmd === '/ayurveda') {
    logTerminal("--- AYURVEDA INTEGRATION METRIC ---", "output");
    logTerminal("Synthesis: Integrates modern human anatomy with traditional Ayurvedic terminologies (e.g. Dhatus, Srotas, Marmas).", "output");
    logTerminal("Significance: Connects historical texts (Sushruta Samhita) to 3D volumetric coordinates. Ready for medical boards.", "output");
  } 
  else if (cleanCmd === '/sim_status' || cleanCmd === '/sim') {
    const accText = document.getElementById('surg-acc-val');
    const accVal = accText ? accText.textContent : 'N/A';
    logTerminal("--- SURGICAL SANDBOX MONITOR ---", "output");
    logTerminal(`Current Tool Module active: Scalpel/Clamp system.`, "output");
    logTerminal(`Telemetry Validation accuracy: ${accVal}.`, "output");
  } 
  else if (cleanCmd === '/connect' || cleanCmd === '/connect_institute') {
    logTerminal("Connecting to SurgiVision VR central server...", "output");
    logTerminal("Institutional Access Link: established.", "output");
    logTerminal("To finalize project onboarding, email: contact@surgivisionvr.edu", "output");
  } 
  else if (cleanCmd === '/clear') {
    const termBody = document.getElementById('term-body');
    if (termBody) termBody.innerHTML = '';
    logTerminal("Logs cleared. System ready.", "output");
  } 
  else {
    logTerminal(`Command failed: '${cmd}'. Type /help for valid terminals.`, "error");
  }
}

/* ==========================================================================
   Mobile Menu Navigation Toggle
   ========================================================================== */
function initMobileNav() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-links a');

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
    
    // Toggle icon state
    const lines = menuToggle.querySelectorAll('span');
    if (menuToggle.classList.contains('active')) {
      lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      lines[1].style.opacity = '0';
      lines[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    } else {
      lines[0].style.transform = 'none';
      lines[1].style.opacity = '1';
      lines[2].style.transform = 'none';
    }
  });

  // Close nav menu on link clicks (mobile view)
  links.forEach(l => {
    l.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuToggle.classList.remove('active');
      const lines = menuToggle.querySelectorAll('span');
      lines[0].style.transform = 'none';
      lines[1].style.opacity = '1';
      lines[2].style.transform = 'none';
    });
  });
}
