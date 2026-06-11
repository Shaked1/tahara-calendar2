/**
 * קומפוננטת HistoryInput - הזנת היסטוריית 6 חודשים מבוססת KosherZmanim
 * כולל: חיפוש מיקום בינלאומי חופשי, הפסק טהרה לכל וסת, וחישוב עונה אסטרונומי תקני
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Trash2, Sun, Moon, Clock, MapPin, Search, Loader2 } from 'lucide-react';
import { OnahType, UserLocation } from '@/types';

// 🌟 שימוש ישיר בפונקציות המצוינות הקיימות שלך בפרויקט!
import { getZmanimForDate, formatTime } from '@/lib/zmanim/index';
import { determineOnahFromDateAndTime } from '@/lib/halacha/onot';

// ──────────────────────────────────────────────
// טיפוסים וממשקים
// ──────────────────────────────────────────────

interface HefsekhEntry {
  date: string;
  time: string;
  onah: OnahType;
}

interface HistoryEntry {
  id: string;
  date: string;
  time: string;
  onah: OnahType;
  isHefsekhOpen?: boolean;
  hefsekh?: HefsekhEntry;
}

interface HistoryInputProps {
  onComplete: (
    entries: Array<{ id: string; date: string; time: string; onah: OnahType; hefsekh?: HefsekhEntry }>,
    location: { lat: number; lng: number; name: string }
  ) => void;
  initialLat?: number;
  initialLng?: number;
  initialLocationName?: string;
}

export function HistoryInput({ 
  onComplete, 
  initialLat = 31.7683, 
  initialLng = 35.2137, 
  initialLocationName = 'ירושלים' 
}: HistoryInputProps) {
  
  // מיקומי ברירת מחדל מהירים
  const presetLocations = [
    { name: 'ירושלים', lat: 31.7683, lng: 35.2137 },
    { name: 'תל אביב', lat: 32.0853, lng: 34.7818 },
    { name: 'בני ברק', lat: 32.0833, lng: 34.8333 },
    { name: 'חיפה', lat: 32.8191, lng: 34.9983 },
    { name: 'ניו יורק', lat: 40.7128, lng: -74.0060 },
    { name: 'לונדון', lat: 51.5074, lng: -0.1278 }
  ];

  // States למיקום
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [locationName, setLocationName] = useState<string>(initialLocationName);
  
  // States למנגנון החיפוש החופשי
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // רשימת הוסתות
  const [entries, setEntries] = useState<HistoryEntry[]>([
    { id: '1', date: '', time: '08:00', onah: 'day' }
  ]);

  // בניית אובייקט מיקום זמני שמתאים לטיפוס ה-UserLocation שלך בפרויקט
  const getCurrentLocationObject = (): UserLocation => ({
    latitude: lat,
    longitude: lng,
    locationName: locationName,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // מזהה אוטומטית את אזור הזמן של הדפדפן/מכשיר
  });

  // פונקציית החיפוש העולמית (Geocoding חופשי מבוסס Nominatim)
  const handleSearchLocation = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setShowDropdown(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=he,en&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Error fetching location:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (name: string, latitude: number, longitude: number) => {
    setLat(latitude);
    setLng(longitude);
    setLocationName(name);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // פונקציית עזר לחישוב עונה מבוססת הקוד שלך ב-onot.ts
  const calculateOnah = (dateStr: string, timeStr: string): OnahType => {
    if (!dateStr) return 'day';
    const loc = getCurrentLocationObject();
    // הפונקציה הקיימת שלך מקבלת אובייקט Date ואת ה-Time כמחרוזת
    return determineOnahFromDateAndTime(new Date(dateStr), timeStr || '08:00', loc);
  };

  // עדכון אוטומטי של העונות בכל פעם שהמיקום, התאריך או השעה משתנים
  useEffect(() => {
    setEntries(prev => prev.map(entry => {
      if (!entry.date) return entry;
      
      const computedOnah = calculateOnah(entry.date, entry.time);
      let updatedHefsekh = entry.hefsekh;
      
      if (entry.hefsekh?.date) {
        updatedHefsekh = {
          ...entry.hefsekh,
          onah: calculateOnah(entry.hefsekh.date, entry.hefsekh.time)
        };
      }

      return { ...entry, onah: computedOnah, hefsekh: updatedHefsekh };
    }));
  }, [lat, lng]);

  const addEntry = () => {
    if (entries.length >= 6) return;
    const nextId = (Math.max(...entries.map(e => parseInt(e.id) || 0)) + 1).toString();
    setEntries([...entries, { id: nextId, date: '', time: '08:00', onah: 'day' }]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, fields: Partial<HistoryEntry>) => {
    setEntries(entries.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, ...fields };
      
      if (updated.date) {
        updated.onah = calculateOnah(updated.date, updated.time);
      }
      return updated;
    }));
  };

  const toggleHefsekh = (id: string) => {
    setEntries(entries.map(e => {
      if (e.id !== id) return e;
      const isOpen = !e.isHefsekhOpen;
      
      let defaultHefsekh = e.hefsekh;
      if (isOpen && !e.hefsekh && e.date) {
        const d = new Date(e.date);
        d.setDate(d.getDate() + 4); 
        const hDate = d.toISOString().split('T')[0];
        defaultHefsekh = {
          date: hDate,
          time: '18:00',
          onah: calculateOnah(hDate, '18:00')
        };
      }
      
      return { ...e, isHefsekhOpen: isOpen, hefsekh: defaultHefsekh };
    }));
  };

  const updateHefsekh = (id: string, fields: Partial<HefsekhEntry>) => {
    setEntries(entries.map(e => {
      if (e.id !== id || !e.hefsekh) return e;
      const updatedHefsekh = { ...e.hefsekh, ...fields };
      
      if (updatedHefsekh.date) {
        updatedHefsekh.onah = calculateOnah(updatedHefsekh.date, updatedHefsekh.time);
      }
      return { ...e, hefsekh: updatedHefsekh };
    }));
  };

  const handleSubmit = () => {
    const valid = entries.filter(e => e.date && e.time);
    if (valid.length === 0) {
      alert('נא להזין לפחות וסת אחת עם תאריך ושעה');
      return;
    }
    
    onComplete(
      valid.map(e => ({
        id: e.id,
        date: e.date,
        time: e.time,
        onah: e.onah,
        hefsekh: e.hefsekh
      })),
      { lat, lng, name: locationName }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-right" dir="rtl">
      
      {/* ── מנגנון בחירת מיקום עולמי חכם ── */}
      <Card className="border-primary/20 shadow-sm bg-primary/5">
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium">
            <MapPin className="h-5 w-5" />
            <h3 className="text-lg font-semibold">הגדרת מיקום בעולם לחישוב זמני שקיעה וזריחה</h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            נא לבחור את המיקום שלך. המערכת תחשב לפיו באופן אוטומטי את עונות היום והלילה המדויקות באמצעות KosherZmanim.
          </p>

          {/* שורת חיפוש חופשי בעולם */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="הקלידי כל עיר או מדינה בעולם... (לדוגמה: תל אביב, פריז, ניו יורק)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation(searchQuery)}
                  className="pr-9"
                />
              </div>
              <Button type="button" onClick={() => handleSearchLocation(searchQuery)} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'חפשי'}
              </Button>
            </div>

            {/* דרופדאון תוצאות חיפוש */}
            {showDropdown && (searchQuery || isSearching || searchResults.length > 0) && (
              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto text-sm">
                {isSearching && <div className="p-3 text-center text-muted-foreground">מחפש מיקום בעולם...</div>}
                {!isSearching && searchResults.length === 0 && (
                  <div className="p-3 text-center text-muted-foreground">לא נמצאו תוצאות. נסי לאיית שוב.</div>
                )}
                {!isSearching && searchResults.map((res: any) => {
                  const shortName = res.display_name.split(',').slice(0, 3).join(',');
                  return (
                    <button
                      key={res.place_id}
                      type="button"
                      onClick={() => selectLocation(shortName, parseFloat(res.lat), parseFloat(res.lon))}
                      className="w-full text-right p-3 hover:bg-muted border-b border-border/40 last:border-0 block transition-colors"
                    >
                      {res.display_name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* כפתורי בחירה מהירה */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground w-full mb-1">בחירה מהירה:</span>
            {presetLocations.map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => selectLocation(loc.name, loc.lat, loc.lng)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                  locationName.includes(loc.name)
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-background hover:bg-muted text-muted-foreground'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          {/* תצוגת המיקום והקואורדינטות */}
          <div className="p-3 bg-background/80 rounded-lg border border-border/60 text-xs flex justify-between items-center text-muted-foreground">
            <div>
              מיקום מוגדר: <strong className="text-foreground">{locationName}</strong>
            </div>
            <div dir="ltr" className="font-mono text-[11px]">
              {lat.toFixed(4)}°N , {lng.toFixed(4)}°E
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── רשימת הוסתות ── */}
      <div className="space-y-4">
        {entries.map((entry, idx) => {
          // 🌟 שליפת הזמנים המדויקים מתוך מודול ה-zmanim המקצועי שלך!
          let sunriseStr = '';
          let sunsetStr = '';
          
          if (entry.date) {
            try {
              const zmanim = getZmanimForDate(new Date(entry.date), getCurrentLocationObject());
              sunriseStr = formatTime(new Date(zmanim.sunrise));
              sunsetStr = formatTime(new Date(zmanim.sunset));
            } catch (e) {
              console.error(e);
            }
          }

          return (
            <Card key={entry.id} className="border-border hover:shadow-sm transition-shadow">
              <CardContent className="p-4 md:p-5 space-y-4">
                
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-sm font-bold text-foreground bg-secondary/60 px-2 py-0.5 rounded">
                    ווסת {idx + 1}
                  </span>
                  {entries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      הסרה
                    </Button>
                  )}
                </div>

                {/* שדות הוסת */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">תאריך תחילת הוסת</label>
                    <Input
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">שעת תחילת הוסת</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                      <Input
                        type="time"
                        value={entry.time}
                        onChange={(e) => updateEntry(entry.id, { time: e.target.value })}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-md p-2 h-10 flex items-center justify-center border border-border/40">
                    {entry.onah === 'day' ? (
                      <span className="text-amber-600 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                        <Sun className="h-4 w-4" /> עונת היום (אוטומטי)
                      </span>
                    ) : (
                      <span className="text-indigo-600 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                        <Moon className="h-4 w-4" /> עונת הלילה (אוטומטי)
                      </span>
                    )}
                  </div>
                </div>

                {/* תצוגת הזמנים המדויקים מהמנוע ההלכתי שלך */}
                {sunriseStr && sunsetStr && (
                  <div className="text-[11px] text-muted-foreground/80 flex gap-4 pr-1">
                    <span>🌅 זריחה הלכתית: {sunriseStr}</span>
                    <span>🌇 שקיעה הלכתית: {sunsetStr}</span>
                  </div>
                )}

                {/* כפתור טוגל להפסק טהרה */}
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleHefsekh(entry.id)}
                    className={`text-xs h-8 ${entry.isHefsekhOpen ? 'bg-emerald-50 text-emerald-700' : 'text-primary'}`}
                  >
                    {entry.isHefsekhOpen ? '✕ סגרי הפסק טהרה' : '➕ הוסיפי הפסק טהרה לווסת זו'}
                  </Button>
                </div>

                {/* אזור הזנת הפסק טהרה */}
                {entry.isHefsekhOpen && entry.hefsekh && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg space-y-3 mt-1">
                    <div className="text-xs font-bold text-emerald-800">פרטי הפסק הטהרה:</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-emerald-700">תאריך הבדיקה</label>
                        <Input
                          type="date"
                          value={entry.hefsekh.date}
                          onChange={(e) => updateHefsekh(entry.id, { date: e.target.value })}
                          className="bg-background border-emerald-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium mb-1 text-emerald-700">שעת הבדיקה</label>
                        <Input
                          type="time"
                          value={entry.hefsekh.time}
                          onChange={(e) => updateHefsekh(entry.id, { time: e.target.value })}
                          className="bg-background border-emerald-200"
                        />
                      </div>

                      <div className="bg-background rounded-md p-2 h-10 flex items-center justify-center border border-emerald-200">
                        {entry.hefsekh.onah === 'day' ? (
                          <span className="text-amber-600 font-medium text-xs flex items-center gap-1">
                            <Sun className="h-3.5 w-3.5" /> עונת היום
                          </span>
                        ) : (
                          <span className="text-indigo-600 font-medium text-xs flex items-center gap-1">
                            <Moon className="h-3.5 w-3.5" /> עונת הלילה
                          </span>
                        )}
                      </div>
                    </div>

                    {entry.hefsekh.onah === 'night' && (
                      <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs">
                        ⚠️ <strong>שים לב:</strong> הבדיקה הוזנה בשעות הלילה (לאחר השקיעה). 
                        הלכתית, הפסק טהרה צריך להתבצע ביום (לפני השקיעה) כדי לעלות למניין 7 נקיים.
                      </div>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── כפתורי פעולה ── */}
      <div className="space-y-4 pt-2">
        <Button
          variant="outline"
          onClick={addEntry}
          className="w-full"
          disabled={entries.length >= 6}
        >
          <Plus className="h-4 w-4 ml-2" />
          {entries.length === 0 ? 'הוסיפי וסת ראשונה' : 'הוסיפי וסת נוספת'}
        </Button>

        <Button onClick={handleSubmit} className="w-full bg-primary text-primary-foreground h-11 text-base font-medium">
          שמירה והמשך בשלבי הקליטה
        </Button>
      </div>
    </div>
  );
}