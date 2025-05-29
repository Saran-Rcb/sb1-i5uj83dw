"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from 'next-themes';

// Fix the default icon issue in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  location?: { latitude: number; longitude: number };
  deliveryAddress?: string;
  isDeliveryPartner?: boolean;
}

// Default location (will use if no specific location provided)
const DEFAULT_LOCATION = { latitude: 51.505, longitude: -0.09 };

export default function Map({ location, deliveryAddress, isDeliveryPartner = false }: MapProps) {
  const { theme } = useTheme();
  const [mapCenter, setMapCenter] = useState(location || DEFAULT_LOCATION);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true after component mounts to prevent hydration issues
    setMounted(true);
    
    // Update map center when location changes
    if (location) {
      setMapCenter(location);
    }
  }, [location]);

  // Prevent hydration errors
  if (!mounted) return null;

  // Get tile layer based on theme
  const tileLayer = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <MapContainer 
      center={[mapCenter.latitude, mapCenter.longitude]} 
      zoom={15} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={tileLayer}
      />
      {location && (
        <Marker position={[location.latitude, location.longitude]}>
          <Popup>
            <div className="p-1">
              <p className="font-medium">Delivery Partner Location</p>
              <p className="text-xs">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>
      )}
      {isDeliveryPartner && (
        <LocationControl />
      )}
    </MapContainer>
  );
}

// A custom control for delivery partners to update their location manually
// (useful for testing without actual GPS)
function LocationControl() {
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    // Cleanup simulation interval on unmount
    return () => {
      if (isSimulating) {
        stopSimulation();
      }
    };
  }, [isSimulating]);

  function startSimulation() {
    setIsSimulating(true);
    // Simulation logic would be implemented here
    toast.success('Location simulation started');
  }

  function stopSimulation() {
    setIsSimulating(false);
    toast.info('Location simulation stopped');
  }

  function toast() {
    return {
      success: (message: string) => console.log('Success:', message),
      info: (message: string) => console.log('Info:', message),
      error: (message: string) => console.log('Error:', message),
    };
  }

  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control leaflet-bar">
        {/* Controls would be implemented here */}
      </div>
    </div>
  );
}