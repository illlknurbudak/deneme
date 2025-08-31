// Generative Art - p5.js
// Zach Lieberman ve Yayoi Kusama'dan ilham
// Klavye Kontrolleri:
// Q/W: Nokta sayısı azalt/artır
// A/S: Bağlantı mesafesi azalt/artır  
// Z/X: Hız azalt/artır
// E/R: Nokta boyutu azalt/artır
// T/Y: Renk değişim hızı azalt/artır
// U/I: Güç alanı azalt/artır
// SPACE: Duraklat/Devam
// ENTER: Sıfırla
// 1: Boids (sürü davranışı)
// 2: Reaction-Diffusion
// 3: Cellular Automata

let particles = [];
let settings = {
  particleCount: 200,
  connectionDistance: 120,
  speed: 1.5,
  nodeSize: 3,
  colorSpeed: 0.5,
  forceField: 50,
  mode: 1 // 1: Boids, 2: Reaction-Diffusion, 3: Cellular Automata
};

let isPaused = false;
let colorOffset = 0;
let grid = [];
let gridSize = 4;

// Reaction-Diffusion değişkenleri
let chemicalA = [];
let chemicalB = [];
let dA = 1.0;
let dB = 0.5;
let feed = 0.055;
let kill = 0.062;

class Particle {
  constructor(x, y) {
    this.pos = createVector(x || random(width), y || random(height));
    this.vel = createVector(random(-2, 2), random(-2, 2));
    this.acc = createVector(0, 0);
    this.maxSpeed = 3;
    this.maxForce = 0.1;
    this.hue = random(360);
    this.energy = random(50, 100);
    this.connections = [];
    this.trail = [];
    this.trailLength = 20;
    
    // Kusama tarzı pulse efekti
    this.pulseOffset = random(TWO_PI);
    this.pulseSpeed = random(0.02, 0.05);
  }

  // Boids algoritması - Craig Reynolds'tan
  flock(particles) {
    let sep = this.separate(particles);
    let ali = this.align(particles);
    let coh = this.cohesion(particles);
    
    // Zach Lieberman tarzı interaktif güçler
    let mouse = this.seek(createVector(mouseX, mouseY));
    
    sep.mult(1.5);
    ali.mult(1.0);
    coh.mult(1.0);
    mouse.mult(0.3);
    
    this.acc.add(sep);
    this.acc.add(ali);
    this.acc.add(coh);
    
    if (mouseIsPressed) {
      this.acc.add(mouse);
    }
  }

  separate(particles) {
    let desiredSep = 25;
    let steer = createVector(0, 0);
    let count = 0;
    
    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < desiredSep) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }
    
    if (count > 0) {
      steer.div(count);
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
    }
    
    return steer;
  }

  align(particles) {
    let neighborDist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.vel);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      let steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce);
      return steer;
    }
    
    return createVector(0, 0);
  }

  cohesion(particles) {
    let neighborDist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.pos);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }
    
    return createVector(0, 0);
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    desired.normalize();
    desired.mult(this.maxSpeed);
    
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  update() {
    // Trail efekti - Zach Lieberman tarzı
    this.trail.push(this.pos.copy());
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }
    
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed * settings.speed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Kusama tarzı renk değişimi
    this.hue += settings.colorSpeed;
    this.energy += sin(frameCount * this.pulseSpeed + this.pulseOffset) * 2;
    this.energy = constrain(this.energy, 20, 120);
    
    // Sınırlar - wrap around
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }

  display() {
    push();
    
    // Trail çizimi - geçmiş pozisyonlar
    for (let i = 0; i < this.trail.length - 1; i++) {
      let alpha = map(i, 0, this.trail.length, 0, 100);
      stroke(this.hue, 80, 90, alpha);
      strokeWeight(map(i, 0, this.trail.length, 1, 3));
      line(this.trail[i].x, this.trail[i].y, 
           this.trail[i + 1].x, this.trail[i + 1].y);
    }
    
    // Ana nokta - Kusama tarzı pulse
    let pulseSize = settings.nodeSize + sin(frameCount * this.pulseSpeed + this.pulseOffset) * 2;
    
    // Dış halka
    fill(this.hue, 60, 100, 80);
    noStroke();
    circle(this.pos.x, this.pos.y, pulseSize * 3);
    
    // Ana nokta
    fill(this.hue, 100, 100);
    circle(this.pos.x, this.pos.y, pulseSize);
    
    // İç parlama - Lieberman tarzı
    fill(0, 0, 100, 150);
    circle(this.pos.x, this.pos.y, pulseSize * 0.3);
    
    pop();
  }

  drawConnections() {
    for (let other of particles) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      if (d < settings.connectionDistance && d > 0) {
        let alpha = map(d, 0, settings.connectionDistance, 100, 0);
        let weight = map(d, 0, settings.connectionDistance, 2, 0.2);
        
        // Gradient bağlantı çizgisi
        strokeWeight(weight);
        
        // Kusama tarzı renkli bağlantılar
        let midHue = (this.hue + other.hue) / 2;
        stroke(midHue, 70, 90, alpha);
        line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        
        // Dinamik parıltı efekti
        if (d < settings.connectionDistance * 0.3) {
          stroke(midHue, 100, 100, alpha * 0.5);
          strokeWeight(weight * 2);
          line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        }
      }
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  
  // Partikülleri başlat
  initParticles();
  
  // Reaction-diffusion grid'i başlat
  initReactionDiffusion();
  
  // Cellular automata grid'i başlat
  initCellularAutomata();
}

function draw() {
  // Arka plan - Kusama tarzı gradient
  for (let i = 0; i <= height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color(250, 20, 5), color(280, 40, 15), inter);
    stroke(c);
    line(0, i, width, i);
  }
  
  if (isPaused) {
    drawPausedText();
    return;
  }
  
  colorOffset += 0.5;
  
  switch (settings.mode) {
    case 1:
      drawBoidsMode();
      break;
    case 2:
      drawReactionDiffusion();
      break;
    case 3:
      drawCellularAutomata();
      break;
  }
  
  // Mod bilgisi
  drawModeInfo();
}

function drawBoidsMode() {
  // Bağlantıları çiz
  for (let particle of particles) {
    particle.drawConnections();
  }
  
  // Partikülleri güncelle ve çiz
  for (let particle of particles) {
    particle.flock(particles);
    particle.update();
    particle.display();
  }
}

function drawReactionDiffusion() {
  updateReactionDiffusion();
  
  for (let x = 0; x < width / gridSize; x++) {
    for (let y = 0; y < height / gridSize; y++) {
      let a = chemicalA[x][y];
      let b = chemicalB[x][y];
      
      let hue = map(a - b, -1, 1, 200, 320);
      let sat = map(a, 0, 1, 30, 100);
      let bright = map(b, 0, 1, 20, 80);
      
      fill(hue, sat, bright);
      noStroke();
      rect(x * gridSize, y * gridSize, gridSize, gridSize);
    }
  }
  
  // Üzerine partiküller ekle
  for (let particle of particles.slice(0, 50)) {
    particle.update();
    particle.display();
  }
}

function drawCellularAutomata() {
  updateCellularAutomata();
  
  for (let x = 0; x < width / gridSize; x++) {
    for (let y = 0; y < height / gridSize; y++) {
      if (grid[x][y] === 1) {
        let hue = (x + y + frameCount * 0.5) % 360;
        fill(hue, 80, 90);
        noStroke();
        rect(x * gridSize, y * gridSize, gridSize, gridSize);
      }
    }
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < settings.particleCount; i++) {
    particles.push(new Particle());
  }
}

function initReactionDiffusion() {
  let cols = width / gridSize;
  let rows = height / gridSize;
  
  chemicalA = [];
  chemicalB = [];
  
  for (let x = 0; x < cols; x++) {
    chemicalA[x] = [];
    chemicalB[x] = [];
    for (let y = 0; y < rows; y++) {
      chemicalA[x][y] = 1;
      chemicalB[x][y] = 0;
    }
  }
  
  // Başlangıç noktaları
  for (let i = 0; i < 10; i++) {
    let x = floor(random(cols));
    let y = floor(random(rows));
    for (let dx = -5; dx <= 5; dx++) {
      for (let dy = -5; dy <= 5; dy++) {
        if (x + dx >= 0 && x + dx < cols && y + dy >= 0 && y + dy < rows) {
          chemicalB[x + dx][y + dy] = 1;
        }
      }
    }
  }
}

function updateReactionDiffusion() {
  let cols = width / gridSize;
  let rows = height / gridSize;
  let nextA = [];
  let nextB = [];
  
  for (let x = 0; x < cols; x++) {
    nextA[x] = [];
    nextB[x] = [];
    for (let y = 0; y < rows; y++) {
      let a = chemicalA[x][y];
      let b = chemicalB[x][y];
      
      let laplaceA = 0;
      let laplaceB = 0;
      
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          let nx = (x + dx + cols) % cols;
          let ny = (y + dy + rows) % rows;
          
          if (dx === 0 && dy === 0) {
            laplaceA += -8 * chemicalA[nx][ny];
            laplaceB += -8 * chemicalB[nx][ny];
          } else {
            laplaceA += chemicalA[nx][ny];
            laplaceB += chemicalB[nx][ny];
          }
        }
      }
      
      let reaction = a * b * b;
      nextA[x][y] = a + (dA * laplaceA - reaction + feed * (1 - a)) * 0.5;
      nextB[x][y] = b + (dB * laplaceB + reaction - (kill + feed) * b) * 0.5;
      
      nextA[x][y] = constrain(nextA[x][y], 0, 1);
      nextB[x][y] = constrain(nextB[x][y], 0, 1);
    }
  }
  
  chemicalA = nextA;
  chemicalB = nextB;
}

function initCellularAutomata() {
  let cols = width / gridSize;
  let rows = height / gridSize;
  
  grid = [];
  for (let x = 0; x < cols; x++) {
    grid[x] = [];
    for (let y = 0; y < rows; y++) {
      grid[x][y] = random() < 0.4 ? 1 : 0;
    }
  }
}

function updateCellularAutomata() {
  let cols = width / gridSize;
  let rows = height / gridSize;
  let next = [];
  
  for (let x = 0; x < cols; x++) {
    next[x] = [];
    for (let y = 0; y < rows; y++) {
      let neighbors = 0;
      
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          let nx = (x + dx + cols) % cols;
          let ny = (y + dy + rows) % rows;
          neighbors += grid[nx][ny];
        }
      }
      
      neighbors -= grid[x][y];
      
      if (grid[x][y] === 1 && (neighbors < 2 || neighbors > 3)) {
        next[x][y] = 0;
      } else if (grid[x][y] === 0 && neighbors === 3) {
        next[x][y] = 1;
      } else {
        next[x][y] = grid[x][y];
      }
    }
  }
  
  grid = next;
}

function keyPressed() {
  switch (key.toLowerCase()) {
    case 'q': settings.particleCount = max(10, settings.particleCount - 10); initParticles(); break;
    case 'w': settings.particleCount = min(500, settings.particleCount + 10); initParticles(); break;
    case 'a': settings.connectionDistance = max(20, settings.connectionDistance - 10); break;
    case 's': settings.connectionDistance = min(300, settings.connectionDistance + 10); break;
    case 'z': settings.speed = max(0.1, settings.speed - 0.2); break;
    case 'x': settings.speed = min(5, settings.speed + 0.2); break;
    case 'e': settings.nodeSize = max(1, settings.nodeSize - 0.5); break;
    case 'r': settings.nodeSize = min(10, settings.nodeSize + 0.5); break;
    case 't': settings.colorSpeed = max(0.1, settings.colorSpeed - 0.1); break;
    case 'y': settings.colorSpeed = min(3, settings.colorSpeed + 0.1); break;
    case 'u': settings.forceField = max(10, settings.forceField - 10); break;
    case 'i': settings.forceField = min(200, settings.forceField + 10); break;
    case ' ': isPaused = !isPaused; break;
    case '1': settings.mode = 1; break;
    case '2': settings.mode = 2; initReactionDiffusion(); break;
    case '3': settings.mode = 3; initCellularAutomata(); break;
  }
  
  if (keyCode === ENTER) {
    initParticles();
    initReactionDiffusion();
    initCellularAutomata();
  }
}

function mousePressed() {
  // Mouse ile yeni partikül ekle
  if (settings.mode === 1) {
    particles.push(new Particle(mouseX, mouseY));
  }
}

function drawModeInfo() {
  fill(0, 0, 100, 80);
  textAlign(RIGHT, BOTTOM);
  textSize(12);
  
  let modeText = "";
  switch (settings.mode) {
    case 1: modeText = "Boids Algorithm"; break;
    case 2: modeText = "Reaction-Diffusion"; break;
    case 3: modeText = "Cellular Automata"; break;
  }
  
  text(modeText, width - 20, height - 20);
  text("Partiküller: " + particles.length, width - 20, height - 40);
}

function drawPausedText() {
  fill(0, 0, 100, 90);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("DURAKLATILDI", width/2, height/2);
  textSize(16);
  text("SPACE tuşuna basın", width/2, height/2 + 40);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initReactionDiffusion();
  initCellularAutomata();
}