'use client';

import React, { useEffect, useRef } from 'react';
import { Place } from '@/lib/recommender';

interface MapProps {
  userLat: number;
  userLng: number;
  places: Place[];
  onSelectPlace?: (place: Place) => void;
  centerPlace?: Place | null;
}

export default function Map({ userLat, userLng, places, onSelectPlace, centerPlace }: MapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let mapInstance: any = null;
    let isMounted = true;

    const initMap = async () => {
      if (!containerRef.current) return;
      
      const L = await import('leaflet');
      
      if (!isMounted) return;

      // Fix for default marker icons if anyone fallback to them
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // 1. Create Map Instance
      mapInstance = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([userLat, userLng], 9);
      
      mapRef.current = mapInstance;

      // 2. Add Dark/Nature Themed Tile Layer (OpenStreetMap)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstance);

      // 3. User Location Marker SVG Icon
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); animation: mapPulse 2s infinite ease-in-out;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #10b981; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
          </div>
          <style>
            @keyframes mapPulse {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(2.5); opacity: 0; }
            }
          </style>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      // Add User Marker
      L.marker([userLat, userLng], { icon: userIcon })
        .addTo(mapInstance)
        .bindPopup(`
          <div style="font-family: inherit; padding: 4px;">
            <strong style="color: #10b981;">Your Location</strong>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280;">Recommendations are computed from here.</p>
          </div>
        `);

      // 4. Place Markers
      const markers: any[] = [];
      places.forEach((place) => {
        const pLat = parseFloat(place.Latitude);
        const pLon = parseFloat(place.Longitude);
        
        if (isNaN(pLat) || isNaN(pLon)) return;

        const isPreferred = place.matchScore && place.matchScore > 20;

        const placeIcon = L.divIcon({
          className: 'custom-place-marker',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
              <svg width="28" height="36" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0ZM12 16.5C9.51 16.5 7.5 14.49 7.5 12C7.5 9.51 9.51 7.5 12 7.5C14.49 7.5 16.5 9.51 16.5 12C16.5 14.49 14.49 16.5 12 16.5Z" 
                  fill="${isPreferred ? '#f59e0b' : '#10b981'}" 
                  stroke="white" 
                  stroke-width="1.5"
                />
                <circle cx="12" cy="12" r="3.5" fill="white" />
              </svg>
            </div>
          `,
          iconSize: [28, 36],
          iconAnchor: [14, 36],
          popupAnchor: [0, -32]
        });

        const marker = L.marker([pLat, pLon], { icon: placeIcon })
          .addTo(mapInstance);

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'inherit';
        popupContent.style.padding = '8px';
        popupContent.style.maxWidth = '200px';

        popupContent.innerHTML = `
          <strong style="color: #f3f4f6; font-size: 14px; display: block; margin-bottom: 4px;">${place.Name}</strong>
          <span style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">${place.Category}</span>
          <div style="font-size: 11px; color: #9ca3af; margin-bottom: 6px;">${place.District} District</div>
          <div style="font-size: 11px; font-weight: bold; color: #f59e0b; margin-bottom: 8px;">★ ${place.Rating} (${place['Review Count'] || 0} reviews)</div>
          <button id="btn-popup-${place['Place ID']}" style="width:100%; border:none; background:#10b981; color:white; padding:6px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:600; text-align:center;">View Details</button>
        `;

        marker.bindPopup(popupContent);

        // Capture popup open to bind event
        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-popup-${place['Place ID']}`);
          if (btn && onSelectPlace) {
            btn.onclick = () => {
              onSelectPlace(place);
            };
          }
        });

        // Store reference to marker
        (marker as any).placeId = place['Place ID'];
        markers.push(marker);
      });

      markersRef.current = markers;
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [userLat, userLng, places]);

  // Handle zooming to centered place
  useEffect(() => {
    if (!mapRef.current || !centerPlace) return;
    
    const pLat = parseFloat(centerPlace.Latitude);
    const pLon = parseFloat(centerPlace.Longitude);

    if (isNaN(pLat) || isNaN(pLon)) return;

    mapRef.current.setView([pLat, pLon], 13);

    // Open popup for centered place marker
    const targetMarker = markersRef.current.find(m => m.placeId === centerPlace['Place ID']);
    if (targetMarker) {
      targetMarker.openPopup();
    }
  }, [centerPlace]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
}
