import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "../../hooks/useLocation";
import { formatTimestamp } from "../../utils/helper";

// Fix leaflet's missing default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CurrentLocationMap = () => {
  const { location, loading, error, accuracy, locationDetails } = useLocation();

  if (loading) {
    return (
      <div className="h-[500px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Tracking your location...</p>
          <p className="text-xs text-gray-500 mt-2">Acquiring GPS signal and calculating accuracy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[500px] w-full rounded-lg bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Location Error</p>
          <p className="text-gray-600 text-sm">
            Unable to get your location. Please check your browser permissions.
          </p>
          <p className="text-xs text-red-500 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="h-[500px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Location not available</p>
      </div>
    );
  }

  // Format accuracy status for popup
  const getAccuracyStatus = (accuracyMeters) => {
    if (!accuracyMeters) return "Unknown accuracy";
    
    if (accuracyMeters <= 10) return `Excellent accuracy (±${accuracyMeters.toFixed(1)}m)`;
    if (accuracyMeters <= 50) return `Good accuracy (±${accuracyMeters.toFixed(1)}m)`;
    if (accuracyMeters <= 100) return `Fair accuracy (±${accuracyMeters.toFixed(1)}m)`;
    return `Poor accuracy (±${accuracyMeters.toFixed(1)}m)`;
  };

  return (
    <div className="h-[500px] w-full rounded-lg">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[location.lat, location.lng]}>
          <Popup>
            <div className="text-center">
              <strong>You are here!</strong>
              <br />
              <small>
                Lat: {location.lat.toFixed(6)}°
                <br />
                Lng: {location.lng.toFixed(6)}°
                {accuracy && (
                  <>
                    <br />
                    <span className={`font-medium ${
                      accuracy <= 10 ? 'text-green-600' :
                      accuracy <= 50 ? 'text-blue-600' :
                      accuracy <= 100 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getAccuracyStatus(accuracy)}
                    </span>
                  </>
                )}
                {locationDetails?.timestamp && (
                  <>
                    <br />
                    Updated: {formatTimestamp(locationDetails.timestamp)}
                  </>
                )}
              </small>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default CurrentLocationMap;
