import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { LngLatLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { TripsLayer } from "deck.gl";
import { cityTripsData, TripData } from "../data/tripsData";

interface DeckGLBackgroundProps {
    className?: string;
}

const DeckGLBackground: React.FC<DeckGLBackgroundProps> = ({ className }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedLocation, setSelectedLocation] = useState<
        (typeof locations)[0] | null
    >(null);

    // Animation speed control (higher = faster, lower = slower)
    const animationSpeed = 0.75;

    const locations: {
        name: string;
        coordinates: LngLatLike;
        zoom: number;
        bearing: number;
        pitch: number;
    }[] = [
        // { name: 'Berlin', coordinates: [13.375390, 52.518763], zoom: 16.70, bearing: 55.20, pitch: 72.50 },
        //{ name: 'Stuttgart', coordinates: [9.179229, 48.77734], zoom: 17.36, bearing: 152.00, pitch: 75.50 },
        //{ name: 'New York City', coordinates: [-73.971274, 40.762698], zoom: 15.60, bearing: 95.94, pitch: 81.38 },
        //test
        {
            name: "Schorndorf",
            coordinates: [9.54339579543857, 48.80613545138229], // Moved more to the right (east)
            zoom: 15.04,
            bearing: 0.0,
            pitch: 60
        }
    ];

    // Get trips data for the selected location
    const getTripsForLocation = (location: (typeof locations)[0]): TripData[] => {
        const cityTrips = cityTripsData[location.name];
        if (cityTrips && cityTrips.length > 0) {
            return cityTrips;
        }

        // Fallback to generated trips if no real data available
        const [lng, lat] = location.coordinates as [number, number];
        const offset = 0.01;

        return [
            {
                path: [
                    [lng - offset, lat - offset, 0],
                    [lng + offset, lat + offset, 600]
                ],
                timestamps: [0, 600]
            },
            {
                path: [
                    [lng + offset, lat - offset, 0],
                    [lng - offset, lat + offset, 800]
                ],
                timestamps: [200, 800]
            },
            {
                path: [
                    [lng, lat + offset, 0],
                    [lng, lat - offset, 1000]
                ],
                timestamps: [400, 1000]
            }
        ];
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;
        let deckOverlay: MapboxOverlay;
        let animationId: number;

        // TODO: das ist mein token, der muss später getauscht werden
        mapboxgl.accessToken =
            "pk.eyJ1IjoiY3JhZnR5Y3JhbSIsImEiOiJjbWZoaWxoZGkwZWtsMmxzZ3M2ajJodnZsIn0.1JbdfnKZZhf1CUByNAElBg";

        const location = locations[Math.floor(Math.random() * locations.length)];
        setSelectedLocation(location);
        const tripsData = getTripsForLocation(location);


        // Initialize Mapbox map with the specified default settings
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/craftycram/cmfhiou9y003c01s589j4au9t", // Keep dark theme
            center: location.coordinates, // Specified coordinates
            zoom: location.zoom, // Specified zoom
            bearing: location.bearing, // Specified bearing
            pitch: location.pitch, // Specified pitch
            antialias: true,
            interactive: false // Disable user interaction
        });

        mapRef.current.on("load", () => {
            // Create deck.gl overlay
            deckOverlay = new MapboxOverlay({
                interleaved: true,
                layers: [
                    new TripsLayer<TripData>({
                        id: "trips",
                        data: tripsData,
                        getPath: (d: TripData) => d.path,
                        getTimestamps: (d: TripData) => d.timestamps,
                        getColor: (_: TripData, { index }: { index: number }) => {
                            const colors: [number, number, number][] = [
                                [253, 128, 93],  // Orange
                                [72, 181, 163],  // Teal
                                [255, 183, 77]   // Yellow
                            ];
                            return colors[index % colors.length];
                        },
                        opacity: 0.8,
                        widthMinPixels: 4,
                        rounded: true,
                        trailLength: 60,
                        currentTime: currentTime
                    })
                ]
            });

            mapRef.current!.addControl(deckOverlay);

            // Animation loop for trips and camera orbit
            const startTime = Date.now();
            const orbitRadius = 0.001; // Small radius for subtle movement
            const orbitSpeed = 0.00005; // Very slow rotation
            const baseCenter = location.coordinates as [number, number];
            const baseBearing = location.bearing;

            const animate = () => {
                setCurrentTime(time => (time + animationSpeed) % 660);

                // Camera orbit animation
                const elapsed = Date.now() - startTime;
                const angle = elapsed * orbitSpeed;
                
                // Calculate new position in a small circle around the center
                const newLng = baseCenter[0] + Math.cos(angle) * orbitRadius;
                const newLat = baseCenter[1] + Math.sin(angle) * orbitRadius;
                
                // Slowly rotate the bearing
                const newBearing = baseBearing + (angle * 0.05) % 360;
                
                if (mapRef.current) {
                    mapRef.current.setCenter([newLng, newLat]);
                    mapRef.current.setBearing(newBearing);
                }

                animationId = requestAnimationFrame(animate);
            };

            animate();
        });

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            if (mapRef.current) {
                mapRef.current.remove();
            }
        };
    }, []);

    // Update trips layer when time changes
    useEffect(() => {
        if (mapRef.current && selectedLocation) {
            const overlay = (mapRef.current as unknown as { __deck?: any }).__deck;
            if (overlay) {
                const tripsData = getTripsForLocation(selectedLocation);

                overlay.setProps({
                    layers: [
                        new TripsLayer<TripData>({
                            id: "trips",
                            data: tripsData,
                            getPath: (d: TripData) => d.path,
                            getTimestamps: (d: TripData) => d.timestamps,
                            getColor: (_: TripData, { index }: { index: number }) => {
                                const colors: [number, number, number][] = [
                                    [253, 128, 93],  // Orange
                                    [72, 181, 163],  // Teal
                                    [255, 183, 77]   // Yellow
                                ];
                                return colors[index % colors.length];
                            },
                            opacity: 0.8,
                            widthMinPixels: 4,
                            rounded: true,
                            trailLength: 60,
                            currentTime: currentTime
                        })
                    ]
                });
            }
        }
    }, [currentTime, selectedLocation]);

    return (
        <div
            ref={mapContainerRef}
            className={className}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: -1,
                pointerEvents: "none"
            }}
        >
            <style>{`
                .mapboxgl-ctrl-logo,
                .mapboxgl-ctrl-attrib {
                    display: none !important;
                }
            `}</style>
        </div>
    );
};

export default DeckGLBackground;
