import React, { useState, useEffect } from 'react';
import { polygonAreaMeters } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Menu, 
  X, 
  Home, 
  Bell,
  CloudSun,
  Sun,
  Moon
} from 'lucide-react';
import WeatherStats from './WeatherStats';
import AlertsPanel from './AlertsPanel';
import IntervalSelector from './IntervalSelector';
import LayerToggle from './LayerToggle';
import PlotDrawer from './PlotDrawer';
import { WeatherData, WeatherAlert } from '@/lib/weather-api';
import { PollingInterval } from '@/hooks/usePolling';

interface SidebarProps {
  weather: WeatherData | null;
  loading: boolean;
  alerts: WeatherAlert[];
  onRemoveAlert: (id: string) => void;
  onClearAlerts: () => void;
  interval: PollingInterval;
  onIntervalChange: (interval: PollingInterval) => void;
  onRefresh: () => void;
  isPolling: boolean;
  layers: {
    rain: boolean;
    wind: boolean;
    temperature: boolean;
    clouds: boolean;
  };
  onLayerChange: (layer: keyof SidebarProps['layers'], value: boolean) => void;

  // plotting / heatmap props (optional)
  showHeatmap?: boolean;
  onHeatmapChange?: (value: boolean) => void;

  isDrawingPlot?: boolean;
  onToggleDrawingPlot?: () => void;
  onClearPlot?: () => void;
  onSavePlot?: () => void;
  plotPointsCount?: number;

  // import coordinates -> parent will receive points as [lon, lat][]
  onImportPlotPoints?: (points: [number, number][]) => void;

  // optional handler: center map on lat/lon
  onGoToLocation?: (lat: number, lon: number) => void;
}

export default function Sidebar({
  weather,
  loading,
  alerts,
  onRemoveAlert,
  onClearAlerts,
  interval,
  onIntervalChange,
  onRefresh,
  isPolling,
  layers,
  onLayerChange,
  showHeatmap,
  onHeatmapChange,
  isDrawingPlot,
  onToggleDrawingPlot,
  onClearPlot,
  onSavePlot,
  plotPointsCount,
  onImportPlotPoints,
  onGoToLocation
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  // dark mode state persisted in localStorage
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('theme');
      if (val) return val === 'dark';
      // fallback: prefer dark if user OS prefers dark
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {}
  }, [darkMode]);

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="secondary"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden glass"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-background/95 backdrop-blur-xl border-r border-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CloudSun className="w-5 h-5 text-primary" />
                  </div>
                  <h1 className="text-lg font-semibold">SEMAGRIC Talhões</h1>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Monitoramento climático em tempo real
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full grid grid-cols-3 m-4 mb-0">
                <TabsTrigger value="stats" className="gap-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Dados</span>
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2">
                  <Bell className="w-4 h-4" />
                  {alerts.length > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                      {alerts.length}
                    </Badge>
                  )}
                  <span className="hidden sm:inline">Alertas</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <CloudSun className="w-4 h-4" />
                  <span className="hidden sm:inline">Config</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="stats" className="h-full m-0">
                  <div className="h-full overflow-y-auto hide-scrollbar p-4">
                    <WeatherStats weather={weather} loading={loading} />
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="h-full m-0">
                  <div className="h-full overflow-y-auto hide-scrollbar p-4">
                    <AlertsPanel
                      alerts={alerts}
                      onRemoveAlert={onRemoveAlert}
                      onClearAll={onClearAlerts}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="h-full m-0">
                  <div className="h-full overflow-y-auto hide-scrollbar p-4 space-y-4">
                    <IntervalSelector
                      interval={interval}
                      onIntervalChange={onIntervalChange}
                      onRefresh={onRefresh}
                      isPolling={isPolling}
                    />
                    <LayerToggle
                      layers={layers}
                      onLayerChange={onLayerChange}
                      showHeatmap={showHeatmap}
                      onHeatmapChange={onHeatmapChange}
                    />
                    <PlotDrawer
                      isDrawing={isDrawingPlot}
                      onToggleDrawing={onToggleDrawingPlot}
                      onClearPlot={onClearPlot}
                      onSavePlot={onSavePlot}
                      pointsCount={plotPointsCount}
                    />

                    {/* Demarcar talhão por coordenadas - cálculo de área */}
                    <div className="mt-4 p-3 border rounded-md bg-muted/50">
                      <h4 className="text-sm font-medium mb-2">Demarcar talhão por coordenadas</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Cole um array JSON de coordenadas [lon, lat] (ex: [[-63.9,-8.76], [-63.91,-8.76], ...])
                      </p>
                      <CoordsAreaCalculator onImport={onImportPlotPoints} />

                      {/* New: small component to search by lat/lon and center the map */}
                      <div className="mt-4 p-3 border rounded-md bg-muted/50">
                        <LocationSearch onGoTo={onGoToLocation} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer: dark mode toggle */}
            <div className="p-4 border-t border-border flex items-center gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDarkMode(d => !d)}
                  aria-label="Alternar tema"
                  className="p-2 rounded-full bg-muted/60 hover:bg-muted/80 flex items-center justify-center"
                >
                  {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
                <div className="text-sm">
                  <div className="font-medium">{darkMode ? 'Dark' : 'Light'}</div>
                  <div className="text-xs text-muted-foreground">Tema</div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function CoordsAreaCalculator({ onImport }: { onImport?: (points: [number, number][]) => void }) {
  const [coordsInput, setCoordsInput] = useState<string>('');
  const [area, setArea] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedCoords, setParsedCoords] = useState<[number, number][] | null>(null);

  const handleCalculate = () => {
    setError(null);
    setArea(null);
    setParsedCoords(null);
    try {
      const parsed = JSON.parse(coordsInput);
      if (!Array.isArray(parsed) || parsed.length < 3) {
        setError('Insira um array JSON com pelo menos 3 coordenadas.');
        return;
      }
      const coords: [number, number][] = parsed.map((c: any) => {
        if (!Array.isArray(c) || c.length < 2) throw new Error('Formato inválido');
        return [Number(c[0]), Number(c[1])];
      });
      setParsedCoords(coords);
      const a = polygonAreaMeters(coords);
      setArea(a);
    } catch (err) {
      setError('Erro ao analisar coordenadas. Verifique o formato JSON.');
    }
  };

  const handleImport = () => {
    if (!parsedCoords) {
      setError('Valide as coordenadas primeiro.');
      return;
    }
    if (typeof onImport === 'function') {
      onImport(parsedCoords);
    }
  };

  return (
    <div>
      <textarea
        className="w-full h-24 p-2 text-sm rounded border"
        placeholder='[[lon,lat],[lon,lat],...]'
        value={coordsInput}
        onChange={(e) => setCoordsInput(e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        <div className="w-full flex flex-col sm:flex-row gap-2">
          <Button className="w-full sm:w-auto" onClick={handleCalculate}>Calcular área</Button>
          <Button variant="ghost" className="w-full sm:w-auto" onClick={() => { setCoordsInput(''); setArea(null); setError(null); }}>
            Limpar
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleImport}
            disabled={!parsedCoords}
          >
            Inserir como pontos
          </Button>
        </div>
      </div>
      {area !== null && (
        <p className="mt-2 text-sm">
          Área: {area.toFixed(2)} m² ({(area / 10000).toFixed(4)} ha)
        </p>
      )}
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
    </div>
  );
}

// New: small component to search by lat/lon and center the map
function LocationSearch({ onGoTo }: { onGoTo?: (lat: number, lon: number) => void }) {
  const [latText, setLatText] = useState('');
  const [lonText, setLonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGo = () => {
    setError(null);
    const lat = Number(latText.replace(',', '.').trim());
    const lon = Number(lonText.replace(',', '.').trim());
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError('Latitude e longitude devem ser números válidos.');
      return;
    }
    if (lat < -90 || lat > 90) {
      setError('Latitude fora do intervalo (-90..90).');
      return;
    }
    if (lon < -180 || lon > 180) {
      setError('Longitude fora do intervalo (-180..180).');
      return;
    }

    if (typeof onGoTo === 'function') {
      onGoTo(lat, lon);
      return;
    }
    const w = window as any;
    if (typeof w.goToMap === 'function') {
      w.goToMap(lat, lon);
      return;
    }
    if (typeof w.__mapFlyTo === 'function') {
      w.__mapFlyTo(lat, lon);
      return;
    }

    setError('Função de centralizar mapa não encontrada. Abra o console para ver instruções.');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Procurar localização (lat / lon)</label>
      <div className="flex gap-2">
        <input
          className="w-1/2 p-2 rounded border text-sm"
          placeholder="Latitude (ex: -8.7619)"
          value={latText}
          onChange={(e) => setLatText(e.target.value)}
        />
        <input
          className="w-1/2 p-2 rounded border text-sm"
          placeholder="Longitude (ex: -63.9039)"
          value={lonText}
          onChange={(e) => setLonText(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button onClick={handleGo} className="px-3 py-1 rounded bg-primary text-white text-sm">
          Centralizar
        </button>
        <button
          onClick={() => { setLatText(''); setLonText(''); setError(null); }}
          className="px-3 py-1 rounded border text-sm"
        >
          Limpar
        </button>
      </div>
      {error && <p className="text-sm text-rose-500 mt-1">{error}</p>}
      <p className="text-xs text-muted-foreground mt-1">
        Dica: insira latitude e longitude separadas por ponto (.) ou vírgula (ex: -8.7619, -63.9039).
      </p>
    </div>
  );
}
