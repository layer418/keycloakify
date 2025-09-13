import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DeckGLBackgroundProps {
  className?: string;
}

const DeckGLBackground: React.FC<DeckGLBackgroundProps> = ({ className }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // TODO: das ist mein token, der muss später getauscht werden
    mapboxgl.accessToken = 'pk.eyJ1IjoiY3JhZnR5Y3JhbSIsImEiOiJjbWZoaWxoZGkwZWtsMmxzZ3M2ajJodnZsIn0.1JbdfnKZZhf1CUByNAElBg';

    // Initialize Mapbox map with the specified default settings
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/craftycram/cmfhiou9y003c01s589j4au9t', // Keep dark theme
      center: [13.375390, 52.518763], // Specified coordinates
      zoom: 16.70, // Specified zoom
      bearing: 55.20, // Specified bearing
      pitch: 72.50, // Specified pitch
      antialias: true,
      interactive: false, // Disable user interaction
    });

    mapRef.current.on('load', () => {
      // Slow orbit animation
      const startTime = Date.now();
      const orbitRadius = 0.002; // Small radius for subtle movement
      const orbitSpeed = 0.0002; // Very slow rotation
      const baseCenter = [13.375390, 52.518763];
      const baseBearing = 55.20;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const angle = elapsed * orbitSpeed;
        
        // Calculate new position in a small circle around the center
        const newLng = baseCenter[0] + Math.cos(angle) * orbitRadius;
        const newLat = baseCenter[1] + Math.sin(angle) * orbitRadius;
        
        // Slowly rotate the bearing
        const newBearing = baseBearing + (angle * 0.1) % 360;
        
        if (mapRef.current) {
          mapRef.current.easeTo({
            center: [newLng, newLat],
            bearing: newBearing,
            duration: 10,
          });
        }
        
        requestAnimationFrame(animate);
      };

      // animate();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default DeckGLBackground;
