import { useEffect, useRef } from 'react';

const MATRIX_LINES = [
  '%#EVNCRUDAZ+6J53TP!S31WY6VX6006QKTN',
  '2+S1EL87WSO13BPJUQ4H2QZ3+H0+47S$P7GHA',
  '950ITFQDQRSFU25BGCS31#F4V9W9M$+O$6W6',
  '47#Q2NP5QKSBPC+JWHBSNB3QX5WJ62DWT00',
  '6O3V4Q0Z1+NNPP3QEB!+#IPGK9RU+U#OUQ10',
  'J=I6!B5G9T8O3UDS+FY7TVF9M0QX4VSP01',
  'CWNUNUH8G5XX5U5V#U6ORQ39!IE+IBP1=',
  '7J!SAMBTVHMQ9TZ9V8MKRB41=6MBOFN+QEE',
  '58R!+H6MG1WZ#03$2UI#H7VWXHAD1YLQG7G',
  'MFSY1S=W!HC9N5WD!TES253KT#70K0TILS1',
  'ZQX!!+0ANBCNV40EX$OR1QXCLCR0$+51Q19',
  'B6G9RDEH40Q5EXW6UYZFQ0YX#H1$GALEYU$',
] as const;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%+!?';

type Fragment = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  startX: number;
  startY: number;
  delay: number;
  chars: string;
};

type Particle = {
  y: number;
  size: number;
  delay: number;
  duration: number;
  startX: number;
  endX: number;
};

interface MatrixMorphCanvasProps {
  imageSrc: string;
  variant?: 'strip' | 'hero';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function easeOutCubic(t: number) {
  const next = 1 - t;
  return 1 - next * next * next;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function createFragments(width: number, height: number, variant: 'strip' | 'hero') {
  const isHero = variant === 'hero';
  const boundaryX = width * (isHero ? 0.48 : 0.52);
  const imageWidth = Math.min(width * (isHero ? 0.24 : 0.22), isHero ? 320 : 182);
  const imageHeight = imageWidth * 1.24;
  const imageX = width - imageWidth - width * (isHero ? 0.1 : 0.06);
  const imageY = isHero ? height * 0.18 : (height - imageHeight) / 2;
  const cols = 5;
  const rows = 6;
  const fragments: Fragment[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const tw = imageWidth / cols;
      const th = imageHeight / rows;
      const delay = 0.08 + col * 0.035 + row * 0.012;
      const startX = boundaryX - (isHero ? 36 : 18) + ((row + col) % 3) * (isHero ? 9 : 6) - 8;
      const startY = imageY + row * th + ((col % 2 === 0 ? 1 : -1) * (isHero ? 12 : 8));
      let chars = '';
      for (let index = 0; index < 4; index += 1) {
        chars += ALPHABET[(row * cols * 3 + col * 5 + index * 7) % ALPHABET.length];
      }

      fragments.push({
        sx: col * tw,
        sy: row * th,
        sw: tw,
        sh: th,
        tx: imageX + col * tw,
        ty: imageY + row * th,
        tw,
        th,
        startX,
        startY,
        delay,
        chars,
      });
    }
  }

  return {
    boundaryX,
    imageRect: { x: imageX, y: imageY, width: imageWidth, height: imageHeight },
    fragments,
  };
}

function createParticles(width: number, height: number, boundaryX: number, variant: 'strip' | 'hero') {
  const isHero = variant === 'hero';
  const particles: Particle[] = [];
  for (let index = 0; index < (isHero ? 40 : 28); index += 1) {
    particles.push({
      y: height * ((isHero ? 0.12 : 0.16) + (index % 12) * (isHero ? 0.06 : 0.055)),
      size: (isHero ? 2 : 1.5) + (index % 3),
      delay: (index * 0.037) % 0.72,
      duration: 3.4 + (index % 5) * 0.24,
      startX: boundaryX - (isHero ? 190 : 130) - (index % 4) * (isHero ? 24 : 18),
      endX: boundaryX + (isHero ? 240 : 170) + (index % 3) * (isHero ? 28 : 22),
    });
  }
  return particles;
}

export function MatrixMorphCanvas({ imageSrc, variant = 'strip' }: MatrixMorphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    const image = new Image();
    if (!imageSrc.startsWith('blob:') && !imageSrc.startsWith('data:')) {
      image.crossOrigin = 'anonymous';
    }

    let animationFrame = 0;
    let imageReady = false;
    let dpr = 1;
    let width = 0;
    let height = 0;
    let boundaryX = 0;
    let fragments: Fragment[] = [];
    let particles: Particle[] = [];
    let imageRect = { x: 0, y: 0, width: 0, height: 0 };

    const resizeCanvas = () => {
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) {
        return;
      }

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.floor(nextWidth * dpr);
      canvas.height = Math.floor(nextHeight * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const nextScene = createFragments(width, height, variant);
      boundaryX = nextScene.boundaryX;
      fragments = nextScene.fragments;
      imageRect = nextScene.imageRect;
      particles = createParticles(width, height, boundaryX, variant);
    };

    const drawMatrixWall = (time: number) => {
      const isHero = variant === 'hero';
      const startX = width * (isHero ? 0.05 : 0.04);
      const startY = height * (isHero ? 0.14 : 0.16);
      const gradient = context.createLinearGradient(startX, 0, boundaryX, 0);
      gradient.addColorStop(0, isHero ? 'rgba(144, 140, 171, 0.46)' : 'rgba(144, 140, 171, 0.82)');
      gradient.addColorStop(0.82, isHero ? 'rgba(144, 140, 171, 0.18)' : 'rgba(144, 140, 171, 0.34)');
      gradient.addColorStop(1, 'rgba(144, 140, 171, 0)');

      context.save();
      context.font = `600 ${isHero ? 13 : 11}px "IBM Plex Mono", monospace`;
      context.fillStyle = gradient;
      context.textBaseline = 'top';

      MATRIX_LINES.forEach((line, index) => {
        const rowY = startY + index * (isHero ? 20 : 16);
        const drift = Math.sin(time * 0.0012 + index * 0.45) * (isHero ? 14 : 10);
        context.globalAlpha = (isHero ? 0.18 : 0.36) + ((Math.sin(time * 0.0018 + index * 0.32) + 1) / 2) * (isHero ? 0.18 : 0.36);
        context.fillText(line, startX + drift, rowY);
      });

      context.restore();
    };

    const drawParticles = (progress: number) => {
      const isHero = variant === 'hero';
      context.save();
      particles.forEach((particle, index) => {
        const local = clamp((progress - particle.delay + 1) % 1 / 0.42, 0, 1);
        if (local <= 0 || local >= 1) {
          return;
        }

        const eased = easeOutCubic(local);
        const x = lerp(particle.startX, particle.endX, eased);
        const alpha = local < 0.5 ? local * 1.8 : (1 - local) * 1.9;

        context.globalAlpha = alpha * (isHero ? 0.7 : 1);
        context.fillStyle = index % 5 === 0
          ? (isHero ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.95)')
          : (isHero ? 'rgba(203,191,255,0.58)' : 'rgba(203,191,255,0.9)');
        context.fillRect(x, particle.y, particle.size, particle.size);
      });
      context.restore();
    };

    const drawImageFrame = (progress: number) => {
      if (!imageReady) {
        return;
      }

      const isHero = variant === 'hero';
      context.save();

      context.fillStyle = isHero ? 'rgba(5, 9, 19, 0.5)' : 'rgba(5, 9, 19, 0.92)';
      context.fillRect(imageRect.x, imageRect.y, imageRect.width, imageRect.height);

      const silhouetteAlpha = (isHero ? 0.05 : 0.08) + smoothstep(0.2, 0.84, progress) * (isHero ? 0.05 : 0.08);
      context.globalAlpha = silhouetteAlpha;
      context.drawImage(image, imageRect.x, imageRect.y, imageRect.width, imageRect.height);
      context.globalAlpha = 1;

      fragments.forEach((fragment) => {
        const local = clamp((progress - fragment.delay) / 0.44, 0, 1);
        if (local <= 0 || local >= 1.05) {
          return;
        }

        const eased = easeOutCubic(local);
        const currentX = lerp(fragment.startX, fragment.tx, eased);
        const currentY = lerp(fragment.startY, fragment.ty, eased);
        const charAlpha = 1 - smoothstep(0.2, 0.62, local);
        const imageAlpha = smoothstep(0.26, 0.88, local);

        context.save();
        context.strokeStyle = isHero ? 'rgba(121,216,255,0.08)' : 'rgba(121,216,255,0.12)';
        context.lineWidth = 1;
        context.fillStyle = isHero ? 'rgba(12,18,33,0.52)' : 'rgba(12,18,33,0.88)';
        context.fillRect(currentX, currentY, fragment.tw, fragment.th);
        context.strokeRect(currentX + 0.5, currentY + 0.5, fragment.tw - 1, fragment.th - 1);

        if (charAlpha > 0.02) {
          context.globalAlpha = charAlpha * (isHero ? 0.55 : 1);
          context.fillStyle = isHero ? 'rgba(121,216,255,0.58)' : 'rgba(121,216,255,0.82)';
          context.font = `600 ${isHero ? 10 : 9}px "IBM Plex Mono", monospace`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(fragment.chars, currentX + fragment.tw / 2, currentY + fragment.th / 2);
        }

        if (imageAlpha > 0.02) {
          context.globalAlpha = imageAlpha * (isHero ? 0.78 : 1);
          context.drawImage(
            image,
            fragment.sx,
            fragment.sy,
            fragment.sw,
            fragment.sh,
            currentX,
            currentY,
            fragment.tw,
            fragment.th,
          );
        }
        context.restore();
      });

      const revealProgress = smoothstep(0.26, 0.82, progress);
      if (revealProgress > 0.01) {
        const revealedWidth = imageRect.width * revealProgress;
        context.save();
        context.beginPath();
        context.rect(imageRect.x, imageRect.y, revealedWidth, imageRect.height);
        context.clip();
        context.drawImage(image, imageRect.x, imageRect.y, imageRect.width, imageRect.height);
        context.restore();
      }

      const sweepX = imageRect.x - 24 + (imageRect.width + 48) * smoothstep(0.24, 0.78, progress);
      const sweepAlpha = smoothstep(0.24, 0.52, progress) * (1 - smoothstep(0.82, 0.96, progress));
      context.save();
      context.globalAlpha = sweepAlpha * (isHero ? 0.6 : 1);
      const sweep = context.createLinearGradient(sweepX - 26, 0, sweepX + 26, 0);
      sweep.addColorStop(0, 'rgba(255,255,255,0)');
      sweep.addColorStop(0.5, isHero ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.34)');
      sweep.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = sweep;
      context.fillRect(imageRect.x, imageRect.y, imageRect.width, imageRect.height);
      context.restore();

      context.strokeStyle = isHero ? 'rgba(121,216,255,0.1)' : 'rgba(121,216,255,0.16)';
      context.strokeRect(imageRect.x + 0.5, imageRect.y + 0.5, imageRect.width - 1, imageRect.height - 1);
      context.restore();
    };

    const render = (time: number) => {
      resizeCanvas();

      context.clearRect(0, 0, width, height);

      const progress = ((time / 1000) % 4.9) / 4.9;

      const bg = context.createLinearGradient(0, 0, width, 0);
      if (variant === 'hero') {
        bg.addColorStop(0, '#07101d');
        bg.addColorStop(0.5, '#081322');
        bg.addColorStop(1, '#060d18');
      } else {
        bg.addColorStop(0, '#070c17');
        bg.addColorStop(0.5, '#050a14');
        bg.addColorStop(1, '#070c17');
      }
      context.fillStyle = bg;
      context.fillRect(0, 0, width, height);

      drawMatrixWall(time);
      drawParticles(progress);
      drawImageFrame(progress);

      animationFrame = window.requestAnimationFrame(render);
    };

    image.onload = () => {
      imageReady = true;
      resizeCanvas();
    };
    image.src = imageSrc;

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [imageSrc, variant]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
