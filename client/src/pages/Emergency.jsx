import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Phone,
  Users,
  MapPin,
  AlertTriangle,
  Mic,
  Send,
  MicOff,
  Trash2,
} from "lucide-react"; // Added Trash2
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useVoice } from "../hooks/useVoice";
import { useApp } from "../context/AppContext";
import { useLocation } from "../hooks/useLocation";
import LocationComponent from "../components/location/LocationComponet";
import { route_endpoint, formatTimestamp } from "../utils/helper";
import {
  getSavedContacts,
  addSavedContact,
  deleteSavedContact,
} from "../utils/apiService";

export default function Emergency() {
  const navigate = useNavigate();
  const { speak } = useVoice();
  const { user } = useApp();
  const {
    location,
    loading: locationLoading,
    error: locationError,
    accuracy,
    locationDetails,
    refreshLocation,
  } = useLocation();

  // All useState hooks first
  const [messages, setMessages] = useState({});
  const [isListening, setIsListening] = useState({});
  const [recognition, setRecognition] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  // Helper function to format accuracy information
  const getAccuracyStatus = (accuracyMeters) => {
    if (!accuracyMeters) return { status: "Unknown", color: "gray", description: "Accuracy information unavailable", tip: null };
    
    if (accuracyMeters <= 10) {
      return { 
        status: "Excellent", 
        color: "green", 
        description: `Your location is very precise (within ${accuracyMeters.toFixed(0)} meters).`,
        tip: null 
      };
    } else if (accuracyMeters <= 50) {
      return { 
        status: "Good", 
        color: "blue", 
        description: `Your location is accurate (within ${accuracyMeters.toFixed(0)} meters).`,
        tip: "For even better accuracy, try moving near a window." 
      };
    } else if (accuracyMeters <= 100) {
      return { 
        status: "Fair", 
        color: "yellow", 
        description: `Your location is approximate (within ${accuracyMeters.toFixed(0)} meters).`,
        tip: "To improve accuracy, move near a window or outdoors if it's safe to do so."
      };
    } else {
      return { 
        status: "Poor", 
        color: "red", 
        description: `Your location may not be precise (over ${accuracyMeters.toFixed(0)} meters).`,
        tip: "For best results, please move outdoors or to a place with a clear view of the sky."
      };
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return formatTimestamp(timestamp);
  };

  // Initialize speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-US";

      setRecognition(recognitionInstance);
    }
  }, []);

  // Fetch contacts effect
  useEffect(() => {
    async function fetchContacts() {
      setLoadingContacts(true);
      let savedContacts = [];
      if (user && user.id) {
        try {
          savedContacts = await getSavedContacts(user.id);
        } catch (e) {
          savedContacts = [];
        }
      }
      const defaultContacts = (user?.emergencyContacts || []).map(
        (contact, index) => ({
          id: `default-${index}`,
          name: contact.name,
          phone: contact.number,
          relationship: "Emergency Contact",
          isDefault: true,
        })
      );
      setEmergencyContacts([...defaultContacts, ...savedContacts]);
      setLoadingContacts(false);
    }
    fetchContacts();
  }, [user]);

  // Re-initialize contacts when user changes
  useEffect(() => {
    if (user && user.emergencyContacts && user.emergencyContacts.length > 0) {
      // Only use default contacts from user.emergencyContacts and saved contacts from API
      const defaultContacts = user.emergencyContacts.map((contact, index) => ({
        id: `default-${index}`,
        name: contact.name,
        phone: contact.number,
        relationship: "Emergency Contact",
        isDefault: true,
      }));
      setEmergencyContacts((prev) => {
        // If already set by fetchContacts, don't duplicate
        const nonDefault = prev.filter((c) => !c.isDefault);
        return [...defaultContacts, ...nonDefault];
      });
    }
  }, [user]);

  // Voice announcement effect
  useEffect(() => {
    speak(
      "Emergency chat is ready. Use the microphone to record messages or type manually, then send via WhatsApp."
    );
  }, [speak]);

  const emergencyHelp = async () => {
    // confirm the action
    const helpConfirm = confirm(
      "Are you sure you want to activate emergency SOS? This will notify your emergency contacts for help and share your location."
    );

    if (!helpConfirm) {
      speak("SOS Message cancelled.");
      return;
    } else {
      speak("SOS Message Sent. Please wait for help.");

      // Get default emergency contacts and send message
      const emergencyMessage = `EMERGENCY SOS ALERT \n\n- I need immediate help! \n- My current location: ${location?.lat.toFixed(6)}, ${location?.lng.toFixed(6)} \n- View on Google Maps: https://www.google.com/maps?q=${location?.lat},${location?.lng} \n- Please contact me or emergency services immediately. \n\nSent from SilverCare AI Emergency System.`;

      // Send emergency message to all default contacts
      const defaultContacts = emergencyContacts.filter((c) => c.isDefault);
      for (const contact of defaultContacts) {
        const whatsappUrl = `https://wa.me/${contact.phone.replace(
          /[^0-9]/g,
          ""
        )}?text=${encodeURIComponent(emergencyMessage)}`;
        window.open(whatsappUrl, "_blank");
      }
      speak(
        "Emergency SOS message sent to your default contacts via WhatsApp."
      );
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      speak("Please enter both name and phone number for the new contact.");
      return;
    }
    if (!user || !user.id) {
      speak("User not authenticated.");
      return;
    }
    const newContact = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relationship: "Custom",
    };
    try {
      await addSavedContact(user.id, newContact);
      setEmergencyContacts((prev) => [...prev, newContact]);
      setNewContactName("");
      setNewContactPhone("");
      setShowAddContactForm(false);
      speak(`${newContact.name} has been added to your emergency contacts.`);
    } catch (e) {
      speak("Failed to add contact.");
    }
  };
  const handleDeleteContact = async (contactId) => {
    if (!user || !user.id) {
      speak("User not authenticated.");
      return;
    }
    try {
      await deleteSavedContact(user.id, contactId);
      setEmergencyContacts((prev) => prev.filter((c) => c.id !== contactId));
      speak("Contact removed.");
    } catch (e) {
      speak("Failed to delete contact.");
    }
  };

  // Handle speech-to-text
  const handleSpeechToText = (contactId) => {
    if (!recognition) {
      speak("Speech recognition is not supported on this device");
      return;
    }

    if (isListening[contactId]) {
      recognition.stop();
      setIsListening((prev) => ({ ...prev, [contactId]: false }));
      return;
    }

    setIsListening((prev) => ({ ...prev, [contactId]: true }));

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessages((prev) => ({
        ...prev,
        [contactId]: transcript,
      }));
      setIsListening((prev) => ({ ...prev, [contactId]: false }));
      speak("Message captured");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening((prev) => ({ ...prev, [contactId]: false }));
      speak("Speech recognition failed");
    };

    recognition.onend = () => {
      setIsListening((prev) => ({ ...prev, [contactId]: false }));
    };

    recognition.start();
    speak("Listening for your message");
  };

  // Handle sending message via WhatsApp
  const handleSendWhatsApp = (contact) => {
    const message = messages[contact.id];
    if (!message || !message.trim()) {
      speak("Please enter a message first");
      return;
    }
    const emergencyMessage = `${message.trim()}`;

    const whatsappUrl = `https://wa.me/${contact.phone.replace(
      /[^0-9]/g,
      ""
    )}?text=${encodeURIComponent(emergencyMessage)}`;

    window.open(whatsappUrl, "_blank");
    speak(`Emergency message sent to ${contact.name} via WhatsApp`);

    // Clear the message after sending
    setMessages((prev) => ({
      ...prev,
      [contact.id]: "",
    }));
  };

  const defaultContacts = emergencyContacts.filter((c) => c.isDefault);
  const savedContacts = emergencyContacts.filter((c) => !c.isDefault);

  return (
    <div className="w-full bg-gradient-to-br from-primary-50 to-primary-100/30 dark:from-dark-100 dark:to-dark-200 pb-40">
      {/* Content */}
      <div className="container mx-auto w-full max-w-4xl px-2 sm:px-4 py-6 sm:py-8 flex-1 flex flex-col gap-8">
        {/* Emergency SOS Help Button Section */}
        <section className="w-full">
          <Card className="p-4 bg-white/90 dark:bg-dark-100/90 backdrop-blur-sm border border-primary-100/20 dark:border-primary-100/10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary-100/50 dark:bg-primary-100/10 rounded-full">
                      <AlertTriangle
                        className="text-primary-300 dark:text-primary-100"
                        size={24}
                      />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-primary-300 dark:text-primary-100">
                      Emergency SOS Button
                    </h2>
                  </div>
                  <button
                    className="text-md font-bold text-white  transition-colors duration-200 bg-red-600 hover:bg-red-700 py-2 px-4 rounded-lg"
                    onClick={() => {
                      emergencyHelp();
                    }}
                  >
                    Get Help
                  </button>
                </div>
                <p className="text-primary-200 dark:text-primary-100/90">
                  Instantly send emergency SOS alerts to your default contacts
                  via WhatsApp with your exact location for immediate
                  assistance.
                </p>
                <div className="mt-2 space-y-1">
                  <span className="text-sm text-yellow-600 block"> 
                    Numbers must be valid WhatsApp numbers
                  </span>
                  <span className="text-sm text-green-600 block">
                    Uses multiple delivery methods for reliability
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Location Section */}
        <section className="w-full">
          <Card className="p-4 sm:p-6 bg-white/90 dark:bg-dark-100/90 backdrop-blur-sm border border-primary-100/20 dark:border-primary-100/10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary-100/50 dark:bg-primary-100/10 rounded-full">
                      <MapPin
                        className="text-primary-300 dark:text-primary-100"
                        size={24}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-primary-300 dark:text-primary-100">
                      Your Current Location
                    </h3>
                  </div>
                  <button
                    className="text-md font-bold text-white  transition-colors duration-200 bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg"
                    onClick={() => {
                      window.location.reload();
                    }}
                  >
                    Reload
                  </button>
                </div>
                {locationLoading ? (
                  <div className="space-y-2">
                    <p className="text-primary-200 dark:text-primary-100/90">
                      <span className="font-medium text-accent-yellow dark:text-accent-yellow/90">
                        Loading location...
                      </span>{" "}
                      Please allow location access for emergency services.
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-yellow"></div>
                      <span className="text-sm text-primary-200/80 dark:text-primary-100/70">
                        Acquiring GPS signal and calculating accuracy...
                      </span>
                    </div>
                  </div>
                ) : locationError ? (
                  <div className="space-y-2">
                    <p className="text-primary-200 dark:text-primary-100/90">
                      <span className="font-medium text-primary-400 dark:text-primary-200">
                        Location unavailable
                      </span>{" "}
                      Please enable location permissions for emergency services.
                    </p>
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      Error: {locationError.message}
                    </div>
                  </div>
                ) : location ? (
                  <div className="space-y-3">
                    <p className="text-primary-200 dark:text-primary-100/90">
                      Location sharing is{" "}
                      <span className="font-medium text-green-500 dark:text-green-500">
                        active
                      </span>{" "}
                      for emergency services.
                    </p>

                    {/* Accuracy Information */}
                    {accuracy && (() => {
                      const accuracyInfo = getAccuracyStatus(accuracy);
                      return (
                        <div className={`p-3 rounded-lg border ${
                          accuracyInfo.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                          accuracyInfo.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                          accuracyInfo.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-primary-300 dark:text-primary-100">GPS Accuracy:</span>
                              <span className={`ml-2 font-semibold ${
                                accuracyInfo.color === 'green' ? 'text-green-600 dark:text-green-400' :
                                accuracyInfo.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                accuracyInfo.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {accuracyInfo.status}
                              </span>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              accuracyInfo.color === 'green' ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' :
                              accuracyInfo.color === 'blue' ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200' :
                              accuracyInfo.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                              'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                            }`}>
                              ±{accuracy.toFixed(1)}m
                            </div>
                          </div>
                          <div className="text-xs text-primary-200/80 dark:text-primary-100/70 mt-1">
                            {accuracyInfo.description}
                          </div>
                          {accuracyInfo.tip && (
                            <div className="mt-2 pt-2 border-t border-primary-100/20 dark:border-primary-100/10 text-xs text-blue-600 dark:text-blue-400">
                              <span className="font-semibold">Tip:</span> {accuracyInfo.tip}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Additional Location Details */}
                    {locationDetails && (
                      <div className="bg-white/50 dark:bg-dark-100/50 p-3 rounded-lg border border-primary-100/20 dark:border-primary-100/10">
                        <div className="text-sm font-medium text-primary-300 dark:text-primary-100 mb-2">
                          Additional GPS Information:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {locationDetails.altitude !== null && (
                            <div>
                              <span className="text-primary-200 dark:text-primary-100/80">Altitude:</span>
                              <span className="ml-2 text-primary-300 dark:text-primary-100 font-mono">
                                {locationDetails.altitude.toFixed(1)}m
                                {locationDetails.altitudeAccuracy && 
                                  ` (±${locationDetails.altitudeAccuracy.toFixed(1)}m)`
                                }
                              </span>
                            </div>
                          )}
                          {locationDetails.speed !== null && locationDetails.speed > 0 && (
                            <div>
                              <span className="text-primary-200 dark:text-primary-100/80">Speed:</span>
                              <span className="ml-2 text-primary-300 dark:text-primary-100 font-mono">
                                {(locationDetails.speed * 3.6).toFixed(1)} km/h
                              </span>
                            </div>
                          )}
                          {locationDetails.heading !== null && (
                            <div>
                              <span className="text-primary-200 dark:text-primary-100/80">Direction:</span>
                              <span className="ml-2 text-primary-300 dark:text-primary-100 font-mono">
                                {locationDetails.heading.toFixed(0)}°
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-primary-200 dark:text-primary-100/80">Last Update:</span>
                            <span className="ml-2 text-primary-300 dark:text-primary-100 font-mono">
                              {formatTime(locationDetails.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Google Maps Link */}
                    <div className="bg-white/50 dark:bg-dark-100/50 p-3 rounded-lg border border-primary-100/20 dark:border-primary-100/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-sm font-medium text-primary-300 dark:text-primary-100">
                            Emergency Location Link:
                          </span>
                          <div className="text-xs text-primary-200/80 dark:text-primary-100/70 mt-1">
                            Share this link with emergency services
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
                            navigator.clipboard.writeText(mapsUrl);
                            speak("Location link copied to clipboard");
                          }}
                          className="text-xs bg-primary-300 hover:bg-primary-400 dark:bg-primary-100 dark:hover:bg-primary-200 text-white px-3 py-1 rounded transition-colors duration-200"
                        >
                          Copy Link
                        </button>
                      </div>
                      
                      {/* Open in Google Maps Button */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => {
                            const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
                            window.open(mapsUrl, "_blank");
                            speak("Opening location in Google Maps");
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                        >
                          <MapPin size={16} />
                          Open in Google Maps
                        </button>
                      </div>
                      
                      {/* Coordinate Display with Click to Copy */}
                      <div className="mt-3 pt-3 border-t border-primary-100/20 dark:border-primary-100/10">
                        <div className="text-xs text-primary-200/80 dark:text-primary-100/70 mb-2">
                          Click coordinates to copy:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${location.lat.toFixed(6)}`);
                              speak("Latitude copied");
                            }}
                            className="text-left p-2 bg-white/70 dark:bg-dark-100/70 rounded border hover:bg-white dark:hover:bg-dark-100 transition-colors"
                          >
                            <div className="text-xs text-primary-200 dark:text-primary-100/80">Latitude:</div>
                            <div className="font-mono text-sm text-primary-300 dark:text-primary-100">
                              {location.lat.toFixed(6)}°
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${location.lng.toFixed(6)}`);
                              speak("Longitude copied");
                            }}
                            className="text-left p-2 bg-white/70 dark:bg-dark-100/70 rounded border hover:bg-white dark:hover:bg-dark-100 transition-colors"
                          >
                            <div className="text-xs text-primary-200 dark:text-primary-100/80">Longitude:</div>
                            <div className="font-mono text-sm text-primary-300 dark:text-primary-100">
                              {location.lng.toFixed(6)}°
                            </div>
                          </button>
                        </div>
                        
                        {/* Full Coordinates Copy */}
                        <button
                          onClick={() => {
                            const coordsText = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
                            navigator.clipboard.writeText(coordsText);
                            speak("Full coordinates copied");
                          }}
                          className="w-full mt-2 p-2 bg-white/70 dark:bg-dark-100/70 rounded border hover:bg-white dark:hover:bg-dark-100 transition-colors text-center"
                        >
                          <div className="text-xs text-primary-200 dark:text-primary-100/80">Full Coordinates:</div>
                          <div className="font-mono text-sm text-primary-300 dark:text-primary-100">
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-primary-200 dark:text-primary-100/90">
                    <span className="font-medium text-primary-300 dark:text-primary-100">
                      Location not available
                    </span>{" "}
                    Using fallback coordinates for emergency services.
                  </p>
                )}
              </div>
            </div>
            <div className="pt-3 max-w-full overflow-x-auto">
              <LocationComponent />
            </div>
          </Card>
        </section>

        {/* Emergency Chat Section */}
        <section className="w-full">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary-100/50 dark:bg-primary-100/10 rounded-lg mr-3 sm:mr-4">
              <Users
                className="text-primary-300 dark:text-primary-100"
                size={24}
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-primary-300 dark:text-primary-100">
              Emergency Chat
            </h3>
          </div>

          {/* Send to Any Number Section */}
          <Card className="mb-4 sm:mb-6 p-4 sm:p-6 bg-white/90 dark:bg-dark-100/90 border border-primary-100/20 dark:border-primary-100/10 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-100/50 dark:bg-primary-100/10 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                <Send
                  className="text-primary-300 dark:text-primary-100"
                  size={24}
                />
              </div>
              <div>
                <h4 className="font-semibold text-primary-300 dark:text-primary-100 text-lg">
                  Send to Any Number
                </h4>
                <p className="text-primary-200 dark:text-primary-100/90 text-sm">
                  Send emergency message to any WhatsApp number
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  type="tel"
                  placeholder="Enter phone number (e.g., 10-digit-number)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="flex-1 p-3 border border-primary-100/20 dark:border-primary-100/10 rounded-lg  bg-white/50 dark:bg-dark-100/50 text-primary-300 dark:text-primary-100 placeholder-primary-200/50 dark:placeholder-primary-100/40 min-w-0"
                />
                <button
                  onClick={() => handleSpeechToText("any-number")}
                  className={`flex justify-center items-center p-3 rounded-full transition-all duration-200 ${
                    isListening["any-number"]
                      ? "bg-primary-400 text-white animate-pulse"
                      : "bg-primary-100/50 dark:bg-primary-100/10 text-primary-300 dark:text-primary-100 hover:bg-primary-200/50 dark:hover:bg-primary-100/20"
                  }`}
                  title={
                    isListening["any-number"]
                      ? "Listening..."
                      : "Start voice recording"
                  }
                >
                  {isListening["any-number"] ? (
                    <MicOff size={22} />
                  ) : (
                    <Mic size={22} />
                  )}
                </button>
              </div>
              <textarea
                value={messages["any-number"] || ""}
                onChange={(e) =>
                  setMessages((prev) => ({
                    ...prev,
                    "any-number": e.target.value,
                  }))
                }
                placeholder="Type emergency message or use microphone..."
                className="w-full p-3 border border-primary-100/20 dark:border-primary-100/10 rounded-lg focus:outline-none  resize-none bg-white/50 dark:bg-dark-100/50 text-primary-300 dark:text-primary-100 placeholder-primary-200/50 dark:placeholder-primary-100/40"
                rows={2}
              />
              {isListening["any-number"] && (
                <p className="text-primary-300 dark:text-primary-100 text-sm animate-pulse">
                  Listening for your voice...
                </p>
              )}
              <button
                onClick={() => {
                  const phoneNumber = newContactPhone.trim();
                  const message = messages["any-number"];
                  if (!phoneNumber) {
                    speak("Please enter a phone number first");
                    return;
                  }
                  if (!message || !message.trim()) {
                    speak("Please enter a message first");
                    return;
                  }
                  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "").trim();
                  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
                    message.trim()
                  )}`;
                  window.open(whatsappUrl, "_blank");
                  speak(
                    `Emergency message sent to ${phoneNumber} via WhatsApp`
                  );
                  setMessages((prev) => ({
                    ...prev,
                    "any-number": "",
                  }));
                }}
                disabled={
                  !newContactPhone.trim() || !messages["any-number"]?.trim()
                }
                className="w-full bg-primary-300 hover:bg-primary-400 dark:bg-primary-100 dark:hover:bg-primary-200 disabled:bg-primary-100/30 dark:disabled:bg-primary-100/10 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <Send size={20} />
                Send via WhatsApp
              </button>
            </div>
          </Card>
        </section>

        {/* New Contact Button & Add Contact Form Section */}
        <section className="w-full">
          <div>
            <button
              onClick={() => setShowAddContactForm(!showAddContactForm)}
              className="mb-4 w-full bg-primary-300 hover:bg-primary-400 dark:bg-primary-100 dark:hover:bg-primary-200 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
            >
              <Users size={20} />
              {showAddContactForm ? "Cancel Adding Contact" : "Add New Contact"}
            </button>
            {showAddContactForm && (
              <Card className="mb-4 p-4 sm:p-6 bg-white/90 dark:bg-dark-100/90 border border-primary-100/20 dark:border-primary-100/10 rounded-2xl backdrop-blur-sm">
                <h4 className="font-semibold text-primary-300 dark:text-primary-100 text-lg mb-4">
                  Add New Emergency Contact
                </h4>
                <div className="space-y-3 sm:space-y-4">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full p-3 border border-primary-100/20 dark:border-primary-100/10 rounded-lg focus:outline-none  bg-white/50 dark:bg-dark-100/50 text-primary-300 dark:text-primary-100 placeholder-primary-200/50 dark:placeholder-primary-100/40"
                  />
                  <input
                    type="tel"
                    placeholder="Contact Phone Number"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full p-3 border border-primary-100/20 dark:border-primary-100/10 rounded-lg focus:outline-none  bg-white/50 dark:bg-dark-100/50 text-primary-300 dark:text-primary-100 placeholder-primary-200/50 dark:placeholder-primary-100/40"
                  />
                  <button
                    onClick={handleAddContact}
                    className="w-full bg-primary-300 hover:bg-primary-400 dark:bg-primary-100 dark:hover:bg-primary-200 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Save Contact
                  </button>
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* Default Contacts Section */}
        <section className="w-full">
          <h4 className="text-xl font-semibold text-primary-300 dark:text-primary-100 mb-4 sm:mb-6">
            Default Contacts
          </h4>
          <div className="space-y-3 sm:space-y-4">
            {defaultContacts.length > 0 ? (
              defaultContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="p-4 sm:p-6 bg-white/90 dark:bg-dark-100/90 border border-primary-100/20 dark:border-primary-100/10 hover:border-primary-200/30 dark:hover:border-primary-100/20 transition-all duration-200 rounded-2xl backdrop-blur-sm"
                >
                  {/* Contact Info Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-primary-100/50 dark:bg-primary-100/10 rounded-full flex items-center justify-center">
                        <span className="text-primary-300 dark:text-primary-100 font-bold text-lg">
                          {contact.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-300 dark:text-primary-100 text-lg">
                          {contact.name}
                        </h4>
                        <p className="text-primary-200 dark:text-primary-100/90 text-sm">
                          {contact.phone}
                        </p>
                        <span className="inline-block px-2 py-1 text-xs bg-primary-100/50 dark:bg-primary-100/10 text-primary-300 dark:text-primary-100 rounded-full">
                          Default Contact
                        </span>
                      </div>
                    </div>

                    {/* Microphone Button */}
                    <button
                      onClick={() => handleSpeechToText(contact.id)}
                      className={`p-3 rounded-full transition-all duration-200 ${
                        isListening[contact.id]
                          ? "bg-primary-400 text-white animate-pulse"
                          : "bg-primary-100/50 dark:bg-primary-100/10 text-primary-300 dark:text-primary-100 hover:bg-primary-200/50 dark:hover:bg-primary-100/20"
                      }`}
                      title={
                        isListening[contact.id]
                          ? "Listening..."
                          : "Start voice recording"
                      }
                    >
                      {isListening[contact.id] ? (
                        <MicOff size={22} />
                      ) : (
                        <Mic size={22} />
                      )}
                    </button>
                  </div>

                  {/* Message Input */}
                  <div className="mb-4">
                    <textarea
                      value={messages[contact.id] || ""}
                      onChange={(e) =>
                        setMessages((prev) => ({
                          ...prev,
                          [contact.id]: e.target.value,
                        }))
                      }
                      placeholder="Type emergency message or use microphone..."
                      className="w-full p-3 border border-primary-100/20 dark:border-primary-100/10 rounded-lg focus:outline-none resize-none bg-white/50 dark:bg-dark-100/50 text-primary-300 dark:text-primary-100 placeholder-primary-200/50 dark:placeholder-primary-100/40"
                      rows={3}
                    />
                    {isListening[contact.id] && (
                      <p className="text-primary-300 dark:text-primary-100 text-sm mt-2 animate-pulse">
                        Listening for your voice...
                      </p>
                    )}
                  </div>

                  {/* Send WhatsApp Button */}
                  <button
                    onClick={() => handleSendWhatsApp(contact)}
                    disabled={!messages[contact.id]?.trim()}
                    className="w-full bg-primary-300 hover:bg-primary-400 dark:bg-primary-100 dark:hover:bg-primary-200 disabled:bg-primary-100/30 dark:disabled:bg-primary-100/10 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                  >
                    <Send size={20} />
                    Send via WhatsApp
                  </button>
                </Card>
              ))
            ) : (
              <p className="text-primary-200 dark:text-primary-100/90 text-center py-8">
                No default contacts available.
              </p>
            )}
          </div>
        </section>

        {/* Saved Contacts Section */}
        <section className="w-full">
          <h4 className="text-xl font-semibold text-primary-300 dark:text-primary-100 mb-4 sm:mb-6">
            Saved Contacts
          </h4>
          <div className="space-y-3 sm:space-y-4">
            {savedContacts.length > 0 ? (
              savedContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="p-4 sm:p-6 bg-white/90 dark:bg-dark-100/90 border border-primary-100/20 dark:border-primary-100/10 hover:border-primary-200/30 dark:hover:border-primary-100/20 transition-all duration-200 rounded-2xl backdrop-blur-sm"
                >
                  {/* Contact Info Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-primary-100/50 dark:bg-primary-100/10 rounded-full flex items-center justify-center">
                        <span className="text-primary-300 dark:text-primary-100 font-bold text-lg">
                          {contact.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-300 dark:text-primary-100 text-lg">
                          {contact.name}
                        </h4>
                        <p className="text-primary-200 dark:text-primary-100/90 text-sm">
                          {contact.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Microphone Button */}
                      <button
                        onClick={() => handleSpeechToText(contact.id)}
                        className={`p-3 rounded-full transition-all duration-200 ${
                          isListening[contact.id]
                            ? "bg-primary-400 text-white animate-pulse"
                            : "bg-primary-100/50 dark:bg-primary-100/10 text-primary-300 dark:text-primary-100 hover:bg-primary-200/50 dark:hover:bg-primary-100/20"
                        }`}
                        title={
                          isListening[contact.id]
                            ? "Listening..."
                            : "Start voice recording"
                        }
                      >
                        {isListening[contact.id] ? (
                          <MicOff size={22} />
                        ) : (
                          <Mic size={22} />
                        )}
                      </button>
                      {/* Delete Contact Button */}
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-3 rounded-full bg-primary-100/50 dark:bg-primary-100/10 text-primary-300 dark:text-primary-100 hover:bg-primary-200/50 dark:hover:bg-primary-100/20 transition-all duration-200"
                        title="Delete Contact"
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="mb-4">
                    <textarea
                      value={messages[contact.id] || ""}
                      onChange={(e) =>
                        setMessages((prev) => ({
                          ...prev,
                          [contact.id]: e.target.value,
                        }))
                      }
                      placeholder="Type emergency message or use microphone..."
                      className="w-full p-3 border border-primary-100/20 dark:border-primary-100/10 rounded-lg focus:outline-none  resize-none bg-white/50 dark:bg-dark-100/50 text-primary-300 dark:text-primary-100 placeholder-primary-200/50 dark:placeholder-primary-100/40"
                      rows={3}
                    />
                    {isListening[contact.id] && (
                      <p className="text-primary-300 dark:text-primary-100 text-sm mt-2 animate-pulse">
                        Listening for your voice...
                      </p>
                    )}
                  </div>

                  {/* Send WhatsApp Button */}
                  <button
                    onClick={() => handleSendWhatsApp(contact)}
                    disabled={!messages[contact.id]?.trim()}
                    className="w-full bg-primary-300 hover:bg-primary-400 dark:bg-primary-100 dark:hover:bg-primary-200 disabled:bg-primary-100/30 dark:disabled:bg-primary-100/10 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                  >
                    <Send size={20} />
                    Send via WhatsApp
                  </button>
                </Card>
              ))
            ) : (
              <p className="text-primary-200 dark:text-primary-100/90 text-center py-8">
                No saved contacts added.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
