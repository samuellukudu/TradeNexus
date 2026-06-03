import React, { useRef, useEffect, useState } from 'react';
import { landPoints } from './landCoordinates';

export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  flag: string;
  demand: string;
  topProduct: string;
  match: string;
  details: string;
  intensity: 'high' | 'medium';
}

interface GlobeProps {
  hotspots: Hotspot[];
  activeHotspot: Hotspot;
  onSelectHotspot: (hotspot: Hotspot) => void;
  language: 'en' | 'zh';
}

export function Globe({ hotspots, activeHotspot, onSelectHotspot, language }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState({ x: 0.15, y: 0 }); // Initial angle
  const rotationRef = useRef(rotation);
  const isDragging = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const pointsRef = useRef<{ lat: number; lon: number }[]>([]);

  // Cache rotation state in ref to avoid stale closures in requestAnimationFrame loop
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Load and pre-convert land coordinates from Degrees to Radians
  useEffect(() => {
    pointsRef.current = landPoints.map(([latDeg, lonDeg]) => ({
      lat: (latDeg * Math.PI) / 180,
      lon: (lonDeg * Math.PI) / 180,
    }));
  }, []);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let pulsePhase = 0;

    const render = () => {
      // 1. Get size and set resolution for crisp retina display
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;
      
      // Fallback check to avoid division-by-zero or canvas errors before sizing is computed
      if (width === 0 || height === 0) {
        animationId = requestAnimationFrame(render);
        return;
      }

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Auto-spin if user is not actively dragging
      if (!isDragging.current) {
        rotationRef.current.y += 0.0028; // Standard spin speed
      }

      const center = { x: width / 2, y: height / 2 };
      // Increased globe scale relative to canvas size to make it feel much larger
      const radius = Math.min(width, height) * 0.46;
      const rotY = rotationRef.current.y;
      const rotX = rotationRef.current.x;

      pulsePhase += 0.25;

      // 2. Draw Sphere Background (Deep dark radial shadow)
      const sphereGrad = ctx.createRadialGradient(center.x, center.y, radius * 0.6, center.x, center.y, radius);
      sphereGrad.addColorStop(0, '#040714');
      sphereGrad.addColorStop(0.7, '#020309');
      sphereGrad.addColorStop(1, '#000000');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric glowing rim
      const glowGrad = ctx.createRadialGradient(center.x, center.y, radius - 2, center.x, center.y, radius + 20);
      glowGrad.addColorStop(0, 'rgba(34, 211, 238, 0.18)');
      glowGrad.addColorStop(0.4, 'rgba(59, 130, 246, 0.08)');
      glowGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius + 20, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw grid lines (Meridians & Parallels)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.04)';
      ctx.lineWidth = 1;
      
      // Parallels (latitude lines)
      for (let latVal = -60; latVal <= 60; latVal += 30) {
        const latRad = (latVal * Math.PI) / 180;
        ctx.beginPath();
        for (let lonVal = -180; lonVal <= 180; lonVal += 5) {
          const lonRad = (lonVal * Math.PI) / 180;
          
          let x3 = Math.cos(latRad) * Math.sin(lonRad + rotY);
          let y3 = Math.sin(latRad);
          let z3 = Math.cos(latRad) * Math.cos(lonRad + rotY);
          
          const rx = y3 * Math.cos(rotX) - z3 * Math.sin(rotX);
          const rz = y3 * Math.sin(rotX) + z3 * Math.cos(rotX);

          if (rz > 0) {
            const sx = center.x + x3 * radius;
            const sy = center.y - rx * radius;
            if (lonVal === -180) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();
      }

      // Meridians (longitude lines)
      for (let lonVal = -180; lonVal < 180; lonVal += 30) {
        const lonRad = (lonVal * Math.PI) / 180;
        ctx.beginPath();
        for (let latVal = -90; latVal <= 90; latVal += 5) {
          const latRad = (latVal * Math.PI) / 180;
          
          let x3 = Math.cos(latRad) * Math.sin(lonRad + rotY);
          let y3 = Math.sin(latRad);
          let z3 = Math.cos(latRad) * Math.cos(lonRad + rotY);
          
          const rx = y3 * Math.cos(rotX) - z3 * Math.sin(rotX);
          const rz = y3 * Math.sin(rotX) + z3 * Math.cos(rotX);

          if (rz > 0) {
            const sx = center.x + x3 * radius;
            const sy = center.y - rx * radius;
            if (latVal === -90) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();
      }

      // 4. Render land points using our GeoJSON-derived coordinates
      pointsRef.current.forEach((pt) => {
        let x = Math.cos(pt.lat) * Math.sin(pt.lon + rotY);
        let y = Math.sin(pt.lat);
        let z = Math.cos(pt.lat) * Math.cos(pt.lon + rotY);

        const rx = y * Math.cos(rotX) - z * Math.sin(rotX);
        const rz = y * Math.sin(rotX) + z * Math.cos(rotX);

        const sx = center.x + x * radius;
        const sy = center.y - rx * radius;

        if (rz > 0) {
          // Front side: bright cyan dots with dynamic opacity for spherical lighting
          ctx.fillStyle = `rgba(34, 211, 238, ${0.12 + rz * 0.65})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.1 + rz * 0.9, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Back side (very translucent cyan/blue glow showing globe depth)
          ctx.fillStyle = `rgba(59, 130, 246, ${0.02 + (1 + rz) * 0.03})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 5. Render B2B procurement hotspots
      hotspots.forEach((spot) => {
        const spotLatRad = (spot.lat * Math.PI) / 180;
        const spotLonRad = (spot.lon * Math.PI) / 180;

        let x = Math.cos(spotLatRad) * Math.sin(spotLonRad + rotY);
        let y = Math.sin(spotLatRad);
        let z = Math.cos(spotLatRad) * Math.cos(spotLonRad + rotY);

        const rx = y * Math.cos(rotX) - z * Math.sin(rotX);
        const rz = y * Math.sin(rotX) + z * Math.cos(rotX);

        if (rz > 0.12) {
          const sx = center.x + x * radius;
          const sy = center.y - rx * radius;

          const isActive = activeHotspot && spot.id === activeHotspot.id;
          const markerColor = spot.intensity === 'high' ? '#f97316' : '#22d3ee';
          const ringColor = spot.intensity === 'high' ? 'rgba(249, 115, 22, 0.45)' : 'rgba(34, 211, 238, 0.45)';

          // Wave pulse ripple ring
          const ringRad = 7 + (pulsePhase % 14);
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(sx, sy, ringRad, 0, Math.PI * 2);
          ctx.stroke();

          // Highlight target ring when active
          if (isActive) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(sx, sy, 8.5, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Core dot
          ctx.fillStyle = markerColor;
          ctx.beginPath();
          ctx.arc(sx, sy, isActive ? 6 : 4.8, 0, Math.PI * 2);
          ctx.fill();
          
          // Glowing center node
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();

          // Text label
          ctx.fillStyle = isActive ? '#ffffff' : '#cbd5e1';
          ctx.font = isActive ? 'bold 10.5px "Outfit", sans-serif' : '500 9.5px "Outfit", sans-serif';
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 4;
          ctx.fillText(`${spot.flag} ${spot.name.split(',')[0]}`, sx + 12, sy + 3);
          ctx.shadowBlur = 0;
        }
      });

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [activeHotspot]);

  // Handle Drag / Rotation Interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;

    setRotation((prev) => ({
      x: Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev.x - deltaY * 0.0055)),
      y: prev.y + deltaX * 0.0055,
    }));

    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Click detection to select hotspots on 3D coordinates
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const center = { x: width / 2, y: height / 2 };
    const radius = Math.min(width, height) * 0.46;
    const rotY = rotationRef.current.y;
    const rotX = rotationRef.current.x;

    let selected: Hotspot | null = null;
    let minDistance = 22; // 22px click threshold

    hotspots.forEach((spot) => {
      const spotLatRad = (spot.lat * Math.PI) / 180;
      const spotLonRad = (spot.lon * Math.PI) / 180;

      let x = Math.cos(spotLatRad) * Math.sin(spotLonRad + rotY);
      let y = Math.sin(spotLatRad);
      let z = Math.cos(spotLatRad) * Math.cos(spotLonRad + rotY);

      const rx = y * Math.cos(rotX) - z * Math.sin(rotX);
      const rz = y * Math.sin(rotX) + z * Math.cos(rotX);

      if (rz > 0.12) {
        const sx = center.x + x * radius;
        const sy = center.y - rx * radius;
        const dist = Math.hypot(clickX - sx, clickY - sy);
        if (dist < minDistance) {
          minDistance = dist;
          selected = spot;
        }
      }
    });

    if (selected) {
      onSelectHotspot(selected);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-h-[500px] max-w-[500px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      />
      <div className="absolute bottom-2 text-[9px] font-mono text-slate-500 select-none">
        {language === 'en' ? 'Drag globe to rotate · Click hotspots' : '拖动地球可进行旋转 · 点击热点查看详情'}
      </div>
    </div>
  );
}
