import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation } from "lucide-react";

interface Location {
  id: number;
  name: string;
  type: "branch" | "atm";
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
}

const Locations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "branch" | "atm">("all");

  // VaultBank branch locations
  const locations: Location[] = [
    {
      id: 1,
      name: "VaultBank New York Financial District",
      type: "branch",
      address: "450 Park Avenue",
      city: "New York",
      state: "NY",
      zip: "10022",
      lat: 40.7614,
      lng: -73.9776
    },
    {
      id: 2,
      name: "VaultBank Los Angeles",
      type: "branch",
      address: "1801 Century Park East",
      city: "Los Angeles",
      state: "CA",
      zip: "90067",
      lat: 34.0553,
      lng: -118.4137
    }
  ];

  const filteredLocations = locations.filter(location => {
    const matchesSearch = 
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.zip.includes(searchQuery);
    
    const matchesFilter = filterType === "all" || location.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">VaultBank Locations</h1>
          <p className="text-xl opacity-90 mb-8">
            Visit our branches across the United States. We provide convenient locations in major cities to serve your banking needs.
          </p>
          
          {/* Search and Filter */}
          <div className="flex gap-4 flex-wrap">
            <Input
              type="text"
              placeholder="Search by city, state, or ZIP code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md bg-primary-foreground text-foreground"
            />
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "secondary" : "outline"}
                onClick={() => setFilterType("all")}
              >
                All Branches
              </Button>
              <Button
                variant={filterType === "branch" ? "secondary" : "outline"}
                onClick={() => setFilterType("branch")}
              >
                Major Cities
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Location List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">
              {filteredLocations.length} Location{filteredLocations.length !== 1 ? 's' : ''} Found
            </h2>
            
            {filteredLocations.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {location.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                          {location.type === "branch" ? "Branch" : "ATM"}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{location.address}</p>
                      <p>{location.city}, {location.state} {location.zip}</p>
                    </div>
                  </div>
                  
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;
