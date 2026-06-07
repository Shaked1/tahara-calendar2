'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { MapPin, Phone, Clock, Navigation, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import { supabase } from '@/lib/supabase/client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

const DEFAULT_CENTER: [number, number] = [31.8928, 34.8113];

const mikvehIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Mikveh {
  id: number;
  mikveName: string;
  mikveCity: string;
  mikveAddress: string;
  mikvePhone: string | null;
  responsibleWorker: string | null;
  accessability: string | null;
  activityHoursShabat: string | null;
  activityHoursWinter: string | null;
  activityHoursSummer: string | null;
  lat: number;
  lon: number;
}

// 1. מאזין לתנועות המפה - מתוקן למניעת לופים
function MapEventsHandler({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend() {
      onBoundsChange(map.getBounds());
    },
  });

  // מריץ פעם אחת בלבד בטעינה הראשונית
  useEffect(() => {
    onBoundsChange(map.getBounds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// 2. פונקציית שינוי מיקום מפה
function ChangeViewOnLocation({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

// 3. פקד חיפוש
function SearchControl() {
  const map = useMap();

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .leaflet-geosearch-bar { max-width: 450px !important; width: 100% !important; }
      .leaflet-geosearch-bar form input {
        font-size: 14px !important;
        font-family: var(--font-hebrew), sans-serif !important;
        padding-right: 40px !important;
        padding-left: 45px !important;
        height: 44px !important;
        border-radius: 12px !important;
      }
      .leaflet-geosearch-bar a.reset { left: 10px !important; right: auto !important; line-height: 44px !important; height: 44px !important; }
    `;
    document.head.appendChild(styleElement);

    const provider = new OpenStreetMapProvider({
      params: { 'accept-language': 'he' },
    });

    // @ts-ignore – GeoSearchControl types are incomplete
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      searchLabel: 'חפשי עיר, רחוב או מיקום...',
      keepResult: true,
    });

    map.addControl(searchControl);

    return () => {
      map.removeControl(searchControl);
      if (document.head.contains(styleElement)) document.head.removeChild(styleElement);
    };
  }, [map]);

  return null;
}

// 4. הקומפוננטה המרכזית
export default function MikvehMap() {
  const [mikvaot, setMikvaot] = useState<Mikveh[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [initialCenter, setInitialCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // שומר על מזהה הבוקס האחרון כדי למנוע קריאות כפולות לאותו מקום
  const lastBoundsRef = useRef<string>('');

  // בקשת מיקום מהדפדפן
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setInitialCenter([latitude, longitude]);
        },
        (error) => {
          console.warn('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleRecenterToUser = () => {
    if (userLocation) {
      setInitialCenter([...userLocation]);
    } else {
      alert('לא ניתן לזהות את מיקומך המדויק.');
    }
  };

  const fetchMikvaotInBounds = useCallback(async (bounds: L.LatLngBounds) => {
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const boundsKey = `${southWest.lat.toFixed(3)},${southWest.lng.toFixed(3)},${northEast.lat.toFixed(3)},${northEast.lng.toFixed(3)}`;

    if (boundsKey === lastBoundsRef.current) return;
    lastBoundsRef.current = boundsKey;

    setLoading(true);
    try {
      // Cast to any to work around the generated types for the RPC call.
      // The actual DB function signature is defined in database.ts → Functions.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
        'get_mikvaot_in_bounds',
        {
          p_min_lat: southWest.lat,
          p_max_lat: northEast.lat,
          p_min_lon: southWest.lng,
          p_max_lon: northEast.lng,
        }
      );

      if (rpcError) throw rpcError;

      let data: Mikveh[] = rpcData ?? [];

      // גלגל הצלה: אם לא חזרו מקוואות בטווח הנוכחי, נביא את הקרובים ביותר
      if (data.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: allData, error: allError } = await (supabase as any)
          .from('mikvaot')
          .select('*')
          .limit(50);

        if (!allError && allData) {
          data = allData as Mikveh[];
        }
      }

      setMikvaot(data);
    } catch (err) {
      console.error('Error fetching mikvaot:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full gap-4 relative">
      {loading && (
        <div className="absolute top-4 right-14 bg-white/90 backdrop-blur-sm z-[1000] px-3 py-1.5 rounded-full shadow-md text-xs font-medium text-indigo-600 flex items-center gap-2 border border-indigo-50">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
          <span>מעדכן מקוואות באזור...</span>
        </div>
      )}

      <button
        onClick={handleRecenterToUser}
        className="absolute bottom-6 left-6 bg-white hover:bg-slate-50 text-gray-700 p-3 rounded-full shadow-lg z-[1000] border border-gray-100"
        title="הקפיצי למיקום שלי"
      >
        <Navigation className="h-5 w-5 text-indigo-600 fill-indigo-600" />
      </button>

      <div className="flex-1 rounded-2xl overflow-hidden shadow-md border border-gray-100 relative z-0 mx-4">
        <MapContainer
          center={initialCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <SearchControl />
          <MapEventsHandler onBoundsChange={fetchMikvaotInBounds} />
          <ChangeViewOnLocation center={initialCenter} />

          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>
                <div className="text-center font-hebrew text-xs font-bold p-1">
                  המיקום הנוכחי שלך 📍
                </div>
              </Popup>
            </Marker>
          )}

          {mikvaot.map((mikveh) => (
            <Marker key={mikveh.id} position={[mikveh.lat, mikveh.lon]} icon={mikvehIcon}>
              <Popup>
                <div className="text-right font-hebrew p-1 space-y-1.5 max-w-[220px]">
                  <h3 className="font-bold text-sm text-indigo-900 border-b pb-1 m-0">
                    {mikveh.mikveName}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-gray-700 mt-1">
                    <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span>
                      {mikveh.mikveAddress}, {mikveh.mikveCity}
                    </span>
                  </div>

                  {mikveh.mikvePhone && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <a href={`tel:${mikveh.mikvePhone}`} className="text-blue-600 hover:underline">
                        {mikveh.mikvePhone}
                      </a>
                    </div>
                  )}

                  {(mikveh.activityHoursWinter ||
                    mikveh.activityHoursSummer ||
                    mikveh.activityHoursShabat) && (
                    <div className="flex flex-col gap-1 border-t pt-1.5 mt-1 bg-slate-50 p-2 rounded-lg text-right">
                      {mikveh.activityHoursWinter && (
                        <div className="flex items-start gap-1 text-[11px] text-gray-600">
                          <Clock className="h-2.5 w-2.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>חורף:</strong> {mikveh.activityHoursWinter}
                          </span>
                        </div>
                      )}
                      {mikveh.activityHoursSummer && (
                        <div className="flex items-start gap-1 text-[11px] text-gray-600">
                          <Clock className="h-2.5 w-2.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>קיץ:</strong> {mikveh.activityHoursSummer}
                          </span>
                        </div>
                      )}
                      {mikveh.activityHoursShabat && (
                        <div className="flex items-start gap-1 text-[11px] text-gray-600 border-t border-gray-200/60 pt-1 mt-1">
                          <Clock className="h-2.5 w-2.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-emerald-700">ערב שבת/חג:</strong>{' '}
                            {mikveh.activityHoursShabat}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {mikveh.accessability && mikveh.accessability !== 'ללא' && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>נגישות: {mikveh.accessability}</span>
                    </div>
                  )}

                  {mikveh.responsibleWorker && (
                    <div className="text-[10px] text-gray-400 italic text-left border-t pt-1">
                      אחראית: {mikveh.responsibleWorker}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
