class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.originalX = x;
        this.originalY = y;
        this.hue = Math.random() * 360;
        this.connections = [];
        this.energy = Math.random() * 100;
        this.pulse = Math.random() * Math.PI * 2;
    }

    update(speed, mouseX, mouseY, mouseInfluence = false) {
        // Mouse etkileşimi
        if (mouseInfluence && mouseX !== null && mouseY !== null) {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const force = (150 - distance) / 150;
                this.vx += (dx / distance) * force * 0.3;
                this.vy += (dy / distance) * force * 0.3;
            }
        }

        // Doğal hareket
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;

        // Sürtünme
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Pozisyon güncelleme
        this.x += this.vx * speed;
        this.y += this.vy * speed;

        // Sınırlar
        if (this.x < 0 || this.x > canvas.width) this.vx *= -0.5;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -0.5;

        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));

        // Enerji ve renk değişimi
        this.energy += Math.sin(Date.now() * 0.003 + this.pulse) * 2;
        this.energy = Math.max(0, Math.min(100, this.energy));
        
        this.hue = (this.hue + 0.5) % 360;
        
        this.connections = [];
    }

    addConnection(particle, distance) {
        this.connections.push({ particle, distance });
    }

    draw(ctx, nodeSize, primaryColor, secondaryColor) {
        // Nokta çizimi
        const intensity = this.energy / 100;
        const size = nodeSize + Math.sin(Date.now() * 0.005 + this.pulse) * 1;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 2);
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${0.8 + intensity * 0.2})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 80%, 30%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();

        // Enerji aura'sı
        if (this.energy > 80) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${(this.energy - 80) / 100})`;
            ctx.fill();
        }
    }

    drawConnections(ctx, connectionDistance) {
        this.connections.forEach(({ particle, distance }) => {
            const opacity = (connectionDistance - distance) / connectionDistance;
            const connectionIntensity = (this.energy + particle.energy) / 200;
            
            const gradient = ctx.createLinearGradient(this.x, this.y, particle.x, particle.y);
            gradient.addColorStop(0, `hsla(${this.hue}, 70%, 50%, ${opacity * connectionIntensity})`);
            gradient.addColorStop(1, `hsla(${particle.hue}, 70%, 50%, ${opacity * connectionIntensity})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = connectionIntensity * 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(particle.x, particle.y);
            ctx.stroke();
        });
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.isMouseActive = false;
        this.settings = {
            particleCount: 150,
            connectionDistance: 120,
            speed: 1,
            nodeSize: 3,
            primaryColor: '#00ffff',
            secondaryColor: '#ff0080'
        };
        this.isPaused = false;
    }

    init(particleCount) {
        this.particles = [];
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(
                Math.random() * canvas.width,
                Math.random() * canvas.height
            ));
        }
    }

    addParticle(x, y) {
        if (this.particles.length < 800) {
            this.particles.push(new Particle(x, y));
        }
    }

    removeRandomParticles(count) {
        for (let i = 0; i < count && this.particles.length > 10; i++) {
            this.particles.splice(Math.floor(Math.random() * this.particles.length), 1);
        }
    }

    calculateConnections() {
        // Bağlantıları temizle
        this.particles.forEach(particle => particle.connections = []);

        // Yeni bağlantıları hesapla
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.settings.connectionDistance) {
                    this.particles[i].addConnection(this.particles[j], distance);
                    this.particles[j].addConnection(this.particles[i], distance);
                }
            }
        }
    }

    update() {
        if (this.isPaused) return;

        // Nokta sayısını ayarla
        const targetCount = this.settings.particleCount;
        if (this.particles.length < targetCount) {
            const toAdd = Math.min(5, targetCount - this.particles.length);
            for (let i = 0; i < toAdd; i++) {
                this.addParticle(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height
                );
            }
        } else if (this.particles.length > targetCount) {
            const toRemove = Math.min(5, this.particles.length - targetCount);
            this.removeRandomParticles(toRemove);
        }

        // Partikülleri güncelle
        this.particles.forEach(particle => {
            particle.update(
                this.settings.speed, 
                this.mouse.x, 
                this.mouse.y, 
                this.isMouseActive
            );
        });

        // Bağlantıları hesapla
        this.calculateConnections();
    }

    draw(ctx) {
        // Bağlantıları çiz
        this.particles.forEach(particle => {
            particle.drawConnections(ctx, this.settings.connectionDistance);
        });

        // Noktaları çiz
        this.particles.forEach(particle => {
            particle.draw(
                ctx, 
                this.settings.nodeSize, 
                this.settings.primaryColor, 
                this.settings.secondaryColor
            );
        });

        // Mouse etkisi
        if (this.isMouseActive && this.mouse.x !== null && this.mouse.y !== null) {
            ctx.beginPath();
            ctx.arc(this.mouse.x, this.mouse.y, 100, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    setMousePosition(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
        this.isMouseActive = true;
    }

    clearMouse() {
        this.isMouseActive = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    reset() {
        this.init(this.settings.particleCount);
    }
}

// Global değişkenler
let canvas, ctx, particleSystem;
let animationId;

function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    particleSystem = new ParticleSystem();
    particleSystem.init(particleSystem.settings.particleCount);
}

function animate() {
    // Arka planı temizle
    ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Sistemi güncelle ve çiz
    particleSystem.update();
    particleSystem.draw(ctx);
    
    animationId = requestAnimationFrame(animate);
}

function setupEventListeners() {
    // Mouse olayları
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        particleSystem.setMousePosition(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    });

    canvas.addEventListener('mouseleave', () => {
        particleSystem.clearMouse();
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        particleSystem.addParticle(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    });

    // Pencere yeniden boyutlandırma
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Kontrol panel olayları
    setupControlListeners();
}

function setupControlListeners() {
    const controls = {
        particleCount: 'particleCount',
        connectionDistance: 'connectionDistance',
        speed: 'speed',
        nodeSize: 'nodeSize',
        primaryColor: 'primaryColor',
        secondaryColor: 'secondaryColor'
    };

    Object.keys(controls).forEach(key => {
        const element = document.getElementById(key);
        const valueDisplay = document.getElementById(key + 'Value');
        
        element.addEventListener('input', (e) => {
            particleSystem.settings[controls[key]] = parseFloat(e.target.value);
            if (valueDisplay) {
                valueDisplay.textContent = e.target.value;
            }
        });
    });

    // Buton olayları
    document.getElementById('resetBtn').addEventListener('click', () => {
        particleSystem.reset();
    });

    document.getElementById('pauseBtn').addEventListener('click', (e) => {
        const isPaused = particleSystem.togglePause();
        e.target.textContent = isPaused ? 'Devam Et' : 'Duraklat';
    });
}

// Başlat
window.addEventListener('load', () => {
    initCanvas();
    setupEventListeners();
    animate();
});