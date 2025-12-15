'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileCheck, Building, Globe, Clock, DollarSign, ZoomIn, ZoomOut } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileMenuButton } from '@/components/ui/mobile-menu-button';
import { 
  PieChart, Pie, Cell, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis
} from 'recharts';
import dynamic from 'next/dynamic';

// Loading component for maps
const MapLoadingFallback = () => (
  <div className="flex items-center justify-center h-[380px] bg-gray-100 rounded-md">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-muted-foreground">กำลังโหลดแผนที่...</p>
    </div>
  </div>
);

// Dynamically import react-simple-maps components with loading states
const ComposableMap = dynamic(
  () => import('react-simple-maps').then(mod => mod.ComposableMap),
  { ssr: false, loading: MapLoadingFallback }
);
const Geographies = dynamic(
  () => import('react-simple-maps').then(mod => mod.Geographies),
  { ssr: false }
);
const Geography = dynamic(
  () => import('react-simple-maps').then(mod => mod.Geography),
  { ssr: false }
);
const ZoomableGroup = dynamic(
  () => import('react-simple-maps').then(mod => mod.ZoomableGroup),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-simple-maps').then(mod => mod.Marker),
  { ssr: false }
);

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Color scale for map - bolder colors with more contrast
const COLOR_RANGE = [
  '#cce5ff', '#99cbff', '#66b0ff', '#3394ff', '#0077ff', '#0066cc', '#004c99'
];

// Base map colors with better contrast
const MAP_COLORS = {
  background: "#f0f8ff",
  ocean: "#B3EBF2",
  defaultCountry: "#C1E1C1",
  countryBorder: "#000000",
  highlightBorder: "#0066cc",
  markers: "#ff4500"
};

interface DashboardStats {
  totalQuotations: number;
  totalDocuments: number;
}

interface CompanyStats {
  company_name: string;
  count: number;
  total_value: number;
}

interface StatusStats {
  status: string;
  count: number;
}

interface CountryStats {
  country: string;
  count: number;
}

interface FinancialMetrics {
  month: string;
  total_revenue: number;
  avg_shipment_value: number;
}

// Chart data types
interface ChartDataItem {
  name: string;
  value: number;
}

// Map data with country codes for WorldMap
interface MapData {
  country: string;
  value: number;
}

// Country coordinates for map markers
interface CountryCoords {
  [key: string]: [number, number]; // [longitude, latitude]
}

// Country name to coordinates mapping (for major countries)
const countryCoordinates: CountryCoords = {
  'Australia': [133.7751, -25.2744],
  'Austria': [14.5501, 47.5162],
  'Belgium': [4.4699, 50.5039],
  'Brazil': [-51.9253, -14.2350],
  'Canada': [-106.3468, 56.1304],
  'China': [104.1954, 35.8617],
  'Czech Republic': [15.4730, 49.8175],
  'Denmark': [9.5018, 56.2639],
  'Finland': [25.7482, 61.9241],
  'France': [2.2137, 46.2276],
  'Germany': [10.4515, 51.1657],
  'Greece': [21.8243, 39.0742],
  'Hong Kong': [114.1694, 22.3193],
  'India': [78.9629, 20.5937],
  'Indonesia': [113.9213, -0.7893],
  'Italy': [12.5674, 41.8719],
  'Japan': [138.2529, 36.2048],
  'Malaysia': [101.9758, 4.2105],
  'Netherlands': [5.2913, 52.1326],
  'New Zealand': [174.8860, -40.9006],
  'Norway': [8.4689, 60.4720],
  'Philippines': [121.7740, 12.8797],
  'Poland': [19.1451, 51.9194],
  'Portugal': [-8.2245, 39.3999],
  'Russia': [105.3188, 61.5240],
  'Singapore': [103.8198, 1.3521],
  'South Africa': [22.9375, -30.5595],
  'South Korea': [127.7669, 35.9078],
  'Spain': [-3.7492, 40.4637],
  'Sweden': [18.6435, 60.1282],
  'Switzerland': [8.2275, 46.8182],
  'Taiwan': [120.9605, 23.6978],
  'Thailand': [100.9925, 15.8700],
  'Turkey': [35.2433, 38.9637],
  'United Arab Emirates': [53.8478, 23.4241],
  'United Kingdom': [-3.4360, 55.3781],
  'United States': [-95.7129, 37.0902],
  'Vietnam': [108.2772, 14.0583]
};

// ISO country names to country codes mapping
const countryToCode: Record<string, string> = {
  'Australia': 'au',
  'Austria': 'at',
  'Belgium': 'be',
  'Brazil': 'br',
  'Canada': 'ca',
  'China': 'cn',
  'Czech Republic': 'cz',
  'Denmark': 'dk',
  'Finland': 'fi',
  'France': 'fr',
  'Germany': 'de',
  'Greece': 'gr',
  'Hong Kong': 'hk',
  'Hungary': 'hu',
  'India': 'in',
  'Indonesia': 'id',
  'Ireland': 'ie',
  'Italy': 'it',
  'Japan': 'jp',
  'Malaysia': 'my',
  'Netherlands': 'nl',
  'New Zealand': 'nz',
  'Norway': 'no',
  'Philippines': 'ph',
  'Poland': 'pl',
  'Portugal': 'pt',
  'Russia': 'ru',
  'Singapore': 'sg',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Spain': 'es',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Taiwan': 'tw',
  'Thailand': 'th',
  'Turkey': 'tr',
  'United Arab Emirates': 'ae',
  'United Kingdom': 'gb',
  'United States': 'us',
  'Vietnam': 'vn'
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotations: 0,
    totalDocuments: 0
  });
  const [topCompanies, setTopCompanies] = useState<CompanyStats[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusStats[]>([]);
  const [countryDistribution, setCountryDistribution] = useState<CountryStats[]>([]);
  const [worldMapData, setWorldMapData] = useState<MapData[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for map zoom and position
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Function to handle zoom
  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  // Type for position from react-simple-maps
  interface MapPosition {
    coordinates: [number, number];
    zoom: number;
  }

  const handleMoveEnd = (position: MapPosition) => {
    setPosition(position);
  };
  
  // Debug data when it changes
  useEffect(() => {
    // Debug country data when it's loaded
    if (countryDistribution.length > 0) {
      console.log("Country distribution data:", countryDistribution);
      
      // Check for problematic entries
      countryDistribution.forEach((country, index) => {
        if (!country.country || country.country === 'Unknown') {
          console.warn(`Found problematic country at index ${index}:`, country);
        }
      });
      
      console.log("Map data:", worldMapData);
    }
  }, [countryDistribution, worldMapData]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get total quotations
        const { count: totalQuotations, error: quotationsError } = await supabase
          .from('quotations')
          .select('*', { count: 'exact', head: true });
        
        if (quotationsError) throw quotationsError;
        
        // Get total documents
        const { count: totalDocuments, error: documentsError } = await supabase
          .from('document_submissions')
          .select('*', { count: 'exact', head: true });
          
        if (documentsError) throw documentsError;

        // Update basic stats
        setStats({
          totalQuotations: totalQuotations || 0,
          totalDocuments: totalDocuments || 0
        });

        try {
          // Get top companies by export volume - with error handling
          const { data: companiesData, error: companiesError } = await supabase
            .from('quotations')
            .select('company_name, total_cost');
            
          if (companiesError) throw companiesError;
          
          if (companiesData && companiesData.length > 0) {
            // Process company statistics
            const companyStats: Record<string, CompanyStats> = {};
            
            companiesData.forEach(quotation => {
              const company_name = quotation.company_name || 'Unknown';
              const total_value = quotation.total_cost || 0;
              
              if (!companyStats[company_name]) {
                companyStats[company_name] = {
                  company_name,
                  count: 0,
                  total_value: 0
                };
              }
              
              companyStats[company_name].count += 1;
              companyStats[company_name].total_value += total_value;
            });
            
            // Convert to array and sort
            const topCompaniesArray = Object.values(companyStats)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5); // Top 5
              
            setTopCompanies(topCompaniesArray);
          }
        } catch (companyError) {
          console.error('Error fetching company statistics:', companyError);
          // Don't fail the entire dashboard for this section
        }

        // NEW: Status Breakdown
        try {
          const { data: statusData, error: statusError } = await supabase
            .from('quotations')
            .select('status');
            
          if (statusError) throw statusError;
          
          if (statusData && statusData.length > 0) {
            const statusStats: Record<string, StatusStats> = {};
            
            statusData.forEach(item => {
              const status = item.status || 'Unknown';
              
              if (!statusStats[status]) {
                statusStats[status] = {
                  status,
                  count: 0
                };
              }
              
              statusStats[status].count += 1;
            });
            
            const statusArray = Object.values(statusStats).sort((a, b) => b.count - a.count);
            setStatusBreakdown(statusArray);
          }
        } catch (statusError) {
          console.error('Error fetching status breakdown:', statusError);
        }

        // NEW: Country Distribution
        try {
          const { data: countryData, error: countryError } = await supabase
            .from('destinations')
            .select('country, id');
            
          if (countryError) throw countryError;
          
          const { data: quotationsWithDest, error: quotDestError } = await supabase
            .from('quotations')
            .select('destination_id');
            
          if (quotDestError) throw quotDestError;
          
          if (countryData && quotationsWithDest) {
            // Count quotations per country
            const countryQuotations: Record<string, number> = {};
            
            // First build a map of destination ID to country
            const destToCountry: Record<string, string> = {};
            countryData.forEach(dest => {
              if (dest.id && dest.country) {
                destToCountry[dest.id] = dest.country;
              }
            });
            
            // Then count quotations per country
            quotationsWithDest.forEach(quot => {
              if (!quot.destination_id) return;
              
              // Only add to country quotations if we have a valid country name (not 'Unknown')
              const country = destToCountry[quot.destination_id];
              
              // Skip if country is undefined or 'Unknown'
              if (!country || country === 'Unknown') return;
              
              if (!countryQuotations[country]) {
                countryQuotations[country] = 0;
              }
              
              countryQuotations[country] += 1;
            });
            
            // Convert to array for charting
            const countryArray = Object.entries(countryQuotations)
              .map(([country, count]) => ({ country, count }))
              .filter(item => {
                // Strict filtering - only include entries with valid country names
                return (
                  item.country && 
                  item.country !== 'Unknown' && 
                  item.country.trim() !== '' &&
                  countryToCode[item.country] // Must have a valid country code
                );
              })
              .sort((a, b) => b.count - a.count);
              
            setCountryDistribution(countryArray);
            
            // Create data for world map
            const mapData: MapData[] = [];
            countryArray.forEach(item => {
              const countryCode = countryToCode[item.country];
              if (countryCode) {
                mapData.push({
                  country: countryCode,
                  value: item.count
                });
              }
            });
            
            setWorldMapData(mapData);
          }
        } catch (countryError) {
          console.error('Error fetching country distribution:', countryError);
        }

        // NEW: Financial Metrics by Month
        try {
          const { data: financialData, error: financialError } = await supabase
            .from('quotations')
            .select('created_at, total_cost');
            
          if (financialError) throw financialError;
          
          if (financialData && financialData.length > 0) {
            // Group by month
            const monthlyMetrics: Record<string, { total: number, count: number }> = {};
            
            financialData.forEach(item => {
              if (!item.created_at) return;
              
              const date = new Date(item.created_at);
              const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              const value = item.total_cost || 0;
              
              if (!monthlyMetrics[monthYear]) {
                monthlyMetrics[monthYear] = { total: 0, count: 0 };
              }
              
              monthlyMetrics[monthYear].total += value;
              monthlyMetrics[monthYear].count += 1;
            });
            
            // Convert to array and calculate averages
            const metricsArray = Object.entries(monthlyMetrics)
              .map(([month, data]) => ({
                month,
                total_revenue: data.total,
                avg_shipment_value: data.count > 0 ? data.total / data.count : 0
              }))
              .sort((a, b) => a.month.localeCompare(b.month));
              
            setFinancialMetrics(metricsArray);
          }
        } catch (financialError) {
          console.error('Error fetching financial metrics:', financialError);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(`Error fetching dashboard data: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'THB' }).format(amount);
  };

  // Simple pie chart component
  const renderPieChart = (data: ChartDataItem[]) => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }: { name: string; percent: number }) => 
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip formatter={(value: number) => `Count: ${value}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Line chart for financial data
  const renderLineChart = (data: FinancialMetrics[]) => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" name="Total Revenue" />
          <Line type="monotone" dataKey="avg_shipment_value" stroke="#82ca9d" name="Avg. Shipment Value" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Get color based on value
  const getColorByValue = (value: number, max: number) => {
    // Calculate normalized value (0-1)
    const normalized = Math.min(1, value / max);
    // Get index in color range
    const index = Math.min(COLOR_RANGE.length - 1, Math.floor(normalized * COLOR_RANGE.length));
    return COLOR_RANGE[index];
  };

  // Function to safely set tooltip content with validation
  const safeSetTooltipContent = (content: string) => {
    // Check if content contains "undefined" and replace with better text
    if (content.includes("undefined")) {
      content = content.replace("undefined", "Unknown country");
    }
    setTooltipContent(content);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <MobileMenuButton />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: {error}</p>}
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.totalQuotations}
            </div>
            <p className="text-xs text-muted-foreground">All quotations in the system</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.totalDocuments}
            </div>
            <p className="text-xs text-muted-foreground">Submitted documents</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Metrics */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              <CardTitle>Financial Metrics</CardTitle>
            </div>
            <CardDescription>Monthly revenue and average shipment value</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-10">Loading financial data...</p>
            ) : financialMetrics.length === 0 ? (
              <p className="text-center py-10">No financial data available</p>
            ) : (
              renderLineChart(financialMetrics)
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Status & Country Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quotation Status Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <CardTitle>Quotation Status Breakdown</CardTitle>
            </div>
            <CardDescription>Distribution of quotation statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-10">Loading status data...</p>
            ) : statusBreakdown.length === 0 ? (
              <p className="text-center py-10">No status data available</p>
            ) : (
              renderPieChart(statusBreakdown.map(item => ({ name: item.status, value: item.count })))
            )}
          </CardContent>
        </Card>
        
        {/* Country Distribution - Interactive Map */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                <CardTitle>Country Distribution</CardTitle>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={handleZoomIn}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
              </div>
            </div>
            <CardDescription>Shipments by destination country (scroll to zoom, drag to pan)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-10">Loading country data...</p>
            ) : countryDistribution.length === 0 ? (
              <p className="text-center py-10">No country data available</p>
            ) : (
              <div className="relative h-[380px] w-full overflow-hidden border rounded-md shadow-md" 
                   style={{backgroundColor: MAP_COLORS.ocean}}
                   onMouseLeave={() => setShowTooltip(false)}
                   onMouseMove={(event: React.MouseEvent) => {
                     // Only update tooltip position if tooltip is showing
                     if (showTooltip) {
                       // Update tooltip position on mouse move
                       const rect = event.currentTarget.getBoundingClientRect();
                       const x = event.clientX - rect.left;
                       const y = event.clientY - rect.top;
                       
                       setTooltipPosition({ x, y });
                     }
                   }}>
                {/* Map container */}
                <div className="absolute inset-0">
                  <ComposableMap
                    projectionConfig={{
                      rotate: [-10, 0, 0],
                      scale: 147
                    }}
                    width={800}
                    height={380}
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: MAP_COLORS.ocean
                    }}
                  >
                    <ZoomableGroup
                      zoom={position.zoom}
                      center={position.coordinates as [number, number]}
                      onMoveEnd={handleMoveEnd}
                      translateExtent={[
                        [-100, -100],
                        [1000, 500]
                      ]}
                    >
                      <Geographies geography="/world-110m.json">
                        {({ geographies }: { geographies: Array<{
                          rsmKey: string;
                          properties: {
                            NAME?: string;
                            ISO_A2?: string;
                            [key: string]: unknown;
                          }
                        }> }) =>
                          geographies.map((geo: {
                            rsmKey: string;
                            properties: {
                              NAME?: string;
                              ISO_A2?: string;
                              [key: string]: unknown;
                            }
                          }) => {
                            // Find matching country by ISO code
                            const countryCode = geo.properties?.ISO_A2?.toLowerCase();
                            
                            // Find if any of our countries match this code - with strict checking
                            const matchingCountry = countryDistribution.find(
                              c => c.country && 
                                   c.country !== 'Unknown' && 
                                   countryToCode[c.country]?.toLowerCase() === countryCode
                            );
                            
                            // Get max value for color scaling
                            const maxValue = Math.max(...countryDistribution.map(c => c.count), 1);
                            
                            // Determine if country has shipments
                            const hasShipments = !!matchingCountry;
                            
                            // Get country name from geo properties
                            const geoCountryName = geo.properties.NAME || "Unknown";
                            
                            // Color based on shipment count
                            const fillColor = hasShipments 
                              ? getColorByValue(matchingCountry.count, maxValue)
                              : MAP_COLORS.defaultCountry;
                            
                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={fillColor}
                                stroke={hasShipments ? MAP_COLORS.highlightBorder : MAP_COLORS.countryBorder}
                                strokeWidth={hasShipments ? 1 : 0.8}
                                style={{
                                  default: {
                                    outline: "none",
                                    fillOpacity: hasShipments ? 1 : 0.8,
                                    cursor: hasShipments ? "pointer" : "default"
                                  },
                                  hover: {
                                    outline: "none",
                                    fillOpacity: 1,
                                    fill: hasShipments ? "#0077ff" : "#f0f0f0",
                                    cursor: hasShipments ? "pointer" : "default",
                                    stroke: hasShipments ? "#000" : MAP_COLORS.countryBorder,
                                    strokeWidth: hasShipments ? 1.5 : 0.8,
                                    transition: "all 250ms"
                                  },
                                  pressed: {
                                    outline: "none"
                                  }
                                }}
                                onMouseEnter={(event: React.MouseEvent) => {
                                  // Skip unknown countries or entities completely
                                  if (geoCountryName === "Unknown" || !hasShipments || !matchingCountry) {
                                    return;
                                  }
                                  
                                  // ONLY show tooltips for countries that have confirmed shipments
                                  safeSetTooltipContent(`${geoCountryName}: ${matchingCountry.count} shipment(s)`);
                                  
                                  // Position tooltip using mouse coordinates
                                  const rect = event.currentTarget.getBoundingClientRect();
                                  const x = event.clientX - rect.left;
                                  const y = event.clientY - rect.top;
                                  
                                  setTooltipPosition({ x, y });
                                  setShowTooltip(true);
                                }}
                                onMouseMove={(event: React.MouseEvent) => {
                                  // Only update tooltip position for countries with shipments
                                  if (hasShipments && showTooltip) {
                                    // Update tooltip position on mouse move
                                    const rect = event.currentTarget.getBoundingClientRect();
                                    const x = event.clientX - rect.left;
                                    const y = event.clientY - rect.top;
                                    
                                    setTooltipPosition({ x, y });
                                  }
                                }}
                                onMouseLeave={() => {
                                  safeSetTooltipContent("");
                                  setShowTooltip(false);
                                }}
                              />
                            );
                          })
                        }
                      </Geographies>
                      
                      {/* Add markers for countries with shipments */}
                      {countryDistribution
                        .filter(country => 
                          // Only include countries with valid names and coordinates
                          country.country && 
                          country.country !== 'Unknown' && 
                          countryCoordinates[country.country]
                        )
                        .map((country) => {
                          const coords = countryCoordinates[country.country];
                          if (!coords) return null;
                          
                          // Scale marker size based on count
                          const maxCount = Math.max(...countryDistribution.map(c => c.count));
                          const size = Math.max(5, Math.min(14, (country.count / maxCount) * 14));
                          
                          // Store the country name and count to avoid undefined values
                          const countryName = country.country;
                          const shipmentCount = country.count;
                          
                          return (
                            <Marker key={countryName} coordinates={coords}>
                              <circle
                                r={size}
                                fill={MAP_COLORS.markers}
                                fillOpacity={0.9}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                                style={{
                                  cursor: "pointer",
                                  transition: "all 250ms",
                                  filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.4))"
                                }}
                                onMouseEnter={(event: React.MouseEvent) => {
                                  // Skip if country is unknown
                                  if (!countryName || countryName === "Unknown") {
                                    return;
                                  }
                                  
                                  // Make circle larger on hover
                                  (event.target as SVGCircleElement).setAttribute('r', `${size * 1.7}`);
                                  (event.target as SVGCircleElement).setAttribute('fill', '#ff2500');
                                  (event.target as SVGCircleElement).setAttribute('stroke-width', '2.5');
                                  (event.target as SVGCircleElement).setAttribute('filter', 'drop-shadow(0px 3px 5px rgba(0,0,0,0.5))');
                                  
                                  // Make sure we never display undefined
                                  const tooltipText = typeof countryName === 'string' && countryName !== ''
                                    ? `${countryName}: ${shipmentCount} shipment(s)` 
                                    : `Country: ${shipmentCount} shipment(s)`;
                                  
                                  safeSetTooltipContent(tooltipText);
                                  
                                  // Position tooltip using mouse coordinates
                                  const rect = event.currentTarget.getBoundingClientRect();
                                  const x = event.clientX - rect.left;
                                  const y = event.clientY - rect.top;
                                  
                                  setTooltipPosition({ x, y });
                                  setShowTooltip(true);
                                }}
                                onMouseMove={(event: React.MouseEvent) => {
                                  // Only update tooltip position for countries with shipments
                                  if (countryDistribution.some(c => c.country && c.country !== 'Unknown') && showTooltip) {
                                    // Update tooltip position on mouse move
                                    const rect = event.currentTarget.getBoundingClientRect();
                                    const x = event.clientX - rect.left;
                                    const y = event.clientY - rect.top;
                                    
                                    setTooltipPosition({ x, y });
                                  }
                                }}
                                onMouseLeave={(event: React.MouseEvent) => {
                                  // Restore original size
                                  (event.target as SVGCircleElement).setAttribute('r', `${size}`);
                                  (event.target as SVGCircleElement).setAttribute('fill', MAP_COLORS.markers);
                                  (event.target as SVGCircleElement).setAttribute('stroke-width', '2');
                                  (event.target as SVGCircleElement).setAttribute('filter', 'drop-shadow(0px 2px 3px rgba(0,0,0,0.4))');
                                  
                                  safeSetTooltipContent("");
                                  setShowTooltip(false);
                                }}
                              />
                            </Marker>
                          );
                        })}
                    </ZoomableGroup>
                  </ComposableMap>
                </div>
                
                {/* Controls */}
                <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                  <button 
                    onClick={handleZoomIn}
                    className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn size={16} className="text-gray-700" />
                  </button>
                  <button 
                    onClick={handleZoomOut}
                    className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors"
                    title="Zoom out"
                  >
                    <ZoomOut size={16} className="text-gray-700" />
                  </button>
                </div>
                
                {/* Custom tooltip */}
                {showTooltip && (
                  <div 
                    className="absolute z-50 px-4 py-2 bg-black text-white text-sm rounded-md shadow-lg pointer-events-none"
                    style={{
                      left: `${tooltipPosition.x}px`,
                      top: `${tooltipPosition.y - 5}px`,
                      transform: "translate(10px, -100%)",
                      fontWeight: "bold",
                      minWidth: "150px",
                      textAlign: "center",
                      opacity: 0.95,
                      border: "1px solid rgba(255,255,255,0.3)",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)"
                    }}
                  >
                    {tooltipContent}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Top Companies */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              <CardTitle>Top Exporting Companies</CardTitle>
            </div>
            <CardDescription>Export count and total value by company</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="volume">
              <TabsList className="mb-4">
                <TabsTrigger value="volume">By Export Count</TabsTrigger>
                <TabsTrigger value="value">By Value</TabsTrigger>
              </TabsList>
              
              <TabsContent value="volume">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Export Count</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : topCompanies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">No data available</TableCell>
                      </TableRow>
                    ) : (
                      topCompanies
                        .sort((a, b) => b.count - a.count)
                        .map((company, index) => (
                          <TableRow key={index}>
                            <TableCell>{company.company_name}</TableCell>
                            <TableCell>{company.count}</TableCell>
                            <TableCell>{formatCurrency(company.total_value)}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="value">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Export Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : topCompanies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">No data available</TableCell>
                      </TableRow>
                    ) : (
                      topCompanies
                        .sort((a, b) => b.total_value - a.total_value)
                        .map((company, index) => (
                          <TableRow key={index}>
                            <TableCell>{company.company_name}</TableCell>
                            <TableCell>{formatCurrency(company.total_value)}</TableCell>
                            <TableCell>{company.count}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 