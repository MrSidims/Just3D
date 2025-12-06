/**
 * Texture Generator Module
 * Implements procedural texture generation using Fractional Brownian Motion (FBM)
 * Ported from Python implementation in /home/mrsidims/Assets/make_sun_equirect2.py
 */

// Simple 3D Perlin noise implementation
class PerlinNoise {
  constructor(seed = 0) {
    this.seed = seed;
    this.p = this.generatePermutation();
  }

  generatePermutation() {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Shuffle using seed
    let rng = this.seed;
    for (let i = 255; i > 0; i--) {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      const j = Math.floor((rng / 0x7fffffff) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // Duplicate the permutation
    return [...p, ...p];
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
      ),
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }
}

// Fractional Brownian Motion
export function fbm(x, y, z, octaves = 5, gain = 0.5, lacunarity = 2.02, noise = null) {
  if (!noise) {
    noise = new PerlinNoise(Date.now());
  }

  let amplitude = 0.5;
  let frequency = 1.0;
  let result = 0.0;
  let maxValue = 0.0;

  for (let i = 0; i < octaves; i++) {
    result += amplitude * noise.noise(x * frequency, y * frequency, z * frequency);
    maxValue += amplitude;

    frequency *= lacunarity;
    amplitude *= gain;
  }

  // Normalize to [0, 1]
  return (result / maxValue + 1.0) / 2.0;
}

// Generate procedural texture for sphere (equirectangular mapping)
export function generateProceduralTexture(width, height, params) {
  const {
    color1 = '#ff6600',
    color2 = '#ffcc00',
    octaves = 5,
    gain = 0.5,
    lacunarity = 2.02,
    seed = Date.now()
  } = params;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);

  // Parse colors
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  // Create noise generator
  const noise = new PerlinNoise(seed);

  // Generate texture
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Convert to spherical coordinates (equirectangular)
      const u = x / width;
      const v = y / height;

      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;

      // Convert to 3D coordinates on unit sphere
      const px = Math.sin(phi) * Math.cos(theta);
      const py = Math.sin(phi) * Math.sin(theta);
      const pz = Math.cos(phi);

      // Get FBM noise value
      const noiseValue = fbm(px * 3, py * 3, pz * 3, octaves, gain, lacunarity, noise);

      // Interpolate between colors
      const r = Math.floor(c1.r + (c2.r - c1.r) * noiseValue);
      const g = Math.floor(c1.g + (c2.g - c1.g) * noiseValue);
      const b = Math.floor(c1.b + (c2.b - c1.b) * noiseValue);

      const index = (y * width + x) * 4;
      imageData.data[index] = r;
      imageData.data[index + 1] = g;
      imageData.data[index + 2] = b;
      imageData.data[index + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Generate solid color texture
export function generateSolidColorTexture(width, height, color) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}
