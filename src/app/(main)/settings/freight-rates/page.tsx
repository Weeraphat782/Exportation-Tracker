'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash, Plus } from 'lucide-react';

// Define the types
interface FreightRate {
  id: number;
  minWeight: number;
  maxWeight: number;
  rate: number;
}

type RatesMap = {
  [country: string]: FreightRate[];
}

// Mock data
const initialRates: RatesMap = {
  'Australia': [
    { id: 1, minWeight: 100, maxWeight: 499, rate: 250 },
    { id: 2, minWeight: 500, maxWeight: 999, rate: 240 },
  ],
  'Lisbon, Portugal': [
    { id: 3, minWeight: 100, maxWeight: 299, rate: 195 },
    { id: 4, minWeight: 300, maxWeight: 499, rate: 190 },
    { id: 5, minWeight: 500, maxWeight: 9999, rate: 185 },
  ],
  'Switzerland': [
    { id: 6, minWeight: 45, maxWeight: 99, rate: 411 },
    { id: 7, minWeight: 100, maxWeight: 249, rate: 301 },
    { id: 8, minWeight: 250, maxWeight: 9999, rate: 271 },
  ]
};

export default function FreightRatesPage() {
  const [countries, setCountries] = useState<string[]>(Object.keys(initialRates));
  const [rates, setRates] = useState<RatesMap>(initialRates);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [minWeight, setMinWeight] = useState<string>('');
  const [maxWeight, setMaxWeight] = useState<string>('');
  const [rateValue, setRateValue] = useState<string>('');

  const handleAddRate = () => {
    if (!selectedCountry || !minWeight || !maxWeight || !rateValue) {
      return;
    }

    const newRate: FreightRate = {
      id: Date.now(),
      minWeight: parseInt(minWeight),
      maxWeight: parseInt(maxWeight),
      rate: parseInt(rateValue)
    };

    if (rates[selectedCountry]) {
      setRates({
        ...rates,
        [selectedCountry]: [...rates[selectedCountry], newRate]
      });
    } else {
      setRates({
        ...rates,
        [selectedCountry]: [newRate]
      });
      setCountries([...countries, selectedCountry]);
    }

    // Reset form
    setMinWeight('');
    setMaxWeight('');
    setRateValue('');
  };

  const handleDeleteRate = (country: string, rateId: number) => {
    const updatedCountryRates = rates[country].filter(rate => rate.id !== rateId);
    
    if (updatedCountryRates.length === 0) {
      const newRates = { ...rates };
      delete newRates[country];
      setRates(newRates);
      setCountries(countries.filter(c => c !== country));
    } else {
      setRates({
        ...rates,
        [country]: updatedCountryRates
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Freight Rates</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Lisbon, Portugal">Lisbon, Portugal</SelectItem>
                  <SelectItem value="Switzerland">Switzerland</SelectItem>
                  <SelectItem value="Japan">Japan</SelectItem>
                  <SelectItem value="China">China</SelectItem>
                  <SelectItem value="South Korea">South Korea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input 
                placeholder="Min Weight" 
                type="number" 
                value={minWeight} 
                onChange={(e) => setMinWeight(e.target.value)} 
              />
            </div>
            <div>
              <Input 
                placeholder="Max Weight" 
                type="number" 
                value={maxWeight} 
                onChange={(e) => setMaxWeight(e.target.value)} 
              />
            </div>
            <div>
              <Input 
                placeholder="Rate" 
                type="number" 
                value={rateValue} 
                onChange={(e) => setRateValue(e.target.value)} 
              />
            </div>
            <div>
              <Button onClick={handleAddRate} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Rate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {countries.map(country => (
        <Card key={country}>
          <CardHeader>
            <CardTitle>{country}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rates[country].map((rate: FreightRate) => (
                <div 
                  key={rate.id} 
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-md"
                >
                  <div>
                    {rate.minWeight}-{rate.maxWeight} kg: ฿{rate.rate}/kg
                  </div>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDeleteRate(country, rate.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 