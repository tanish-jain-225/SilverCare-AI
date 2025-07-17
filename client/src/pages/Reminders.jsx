import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Clock,
  Volume2,
  Trash2,
  RefreshCw,
  Mic,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { useVoice } from "../hooks/useVoice";
import { route_endpoint, convertTo24Hour, formatTimeForDisplay, formatTimeForSpeech, formatDate } from "../utils/helper";
import { useApp } from "../context/AppContext";

export function Reminders() {
  const navigate = useNavigate();
  const { speak, stop, isSpeaking } = useVoice();
  const { user } = useApp();
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    time: "",
    date: "",
  });
  const [alarmAudio, setAlarmAudio] = useState(null);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle"); // 'idle', 'syncing', 'success', 'error'

  // Filter out duplicate reminders by created_at
  const uniqueReminders = React.useMemo(
    () => Array.from(new Map(reminders.map((r) => [r.created_at, r])).values()),
    [reminders]
  );

  // Enhanced fetch with better error handling and sync status
  const fetchReminders = async (showLoadingState = true) => {
    if (!user?.id) {
      console.error("No user ID available for fetching reminders");
      return;
    }

    try {
      if (showLoadingState) {
        setIsLoading(true);
        setSyncStatus("syncing");
      }

      const response = await fetch(
        `${route_endpoint}/reminders?userId=${user.id}&timestamp=${Date.now()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "omit",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reminders: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.reminders)) {
        // Sort reminders by created_at in descending order (newest first)
        // and normalize time format to 12-hour display format
        const sortedReminders = data.reminders
          .map(reminder => ({
            ...reminder,
            time: formatTimeForDisplay(reminder.time) // Ensure 12-hour format
          }))
          .sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
        setReminders(sortedReminders);
        setSyncStatus("success");
      } else {
        throw new Error("Invalid reminders data format");
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      setSyncStatus("error");
      speak("Sorry, there was an issue syncing your reminders");
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
        setTimeout(() => setSyncStatus("idle"), 2000);
      }
    }
  };
  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.time || !newReminder.date) {
      console.error("Missing required fields:", { newReminder });
      return;
    }
    if (!user?.id) {
      console.error("No user ID available");
      speak("Please log in to add reminders");
      return;
    }

    setIsLoading(true);
    const reminder = {
      title: newReminder.title,
      time: newReminder.time,
      date: newReminder.date,
      userId: user.id,
    };

    try {
      setSyncStatus("syncing");
      const response = await fetch(`${route_endpoint}/reminder-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(reminder),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save reminder to server");
      }

      const data = await response.json();

      if (data.success) {
        // Fetch updated reminders after successful addition
        await fetchReminders(false);
        setShowAddForm(false);
        setNewReminder({ title: "", time: "", date: "" });
        speak("Reminder added successfully");
        setSyncStatus("success");
      } else {
        throw new Error(data.error || "Failed to save reminder");
      }
    } catch (error) {
      console.error("Error saving reminder:", error);
      speak("Failed to save reminder. Please try again.");
      setSyncStatus("error");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteReminder = async (reminderId) => {
    if (!user?.id) {
      speak("Please log in to delete reminders");
      return;
    }

    setIsLoading(true);
    try {
      setSyncStatus("syncing");
      const response = await fetch(`${route_endpoint}/delete-reminder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: reminderId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete reminder from server");
      }

      const data = await response.json();

      if (data.success) {
        // Fetch updated reminders after successful deletion
        await fetchReminders(false);
        speak("Reminder deleted successfully");
        setSyncStatus("success");
      } else {
        throw new Error(data.error || "Failed to delete reminder");
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
      speak("Failed to delete reminder. Please try again.");
      setSyncStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadReminder = (reminder) => {
    const timeForSpeech = formatTimeForSpeech(reminder.time);
    speak(
      `Reminder: ${reminder.title} at ${timeForSpeech} on ${reminder.date}`
    );
  };

  // Use formatDate from helper.js for consistency - no local function needed

  // Local notification scheduling
  React.useEffect(() => {
    // Request notification permission on mount
    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Alarm scheduling with cleanup and limit
  React.useEffect(() => {
    let timers = [];
    let alarmActive = false;
    // Only schedule alarms for future reminders and limit to 1 audio at a time
    const now = new Date();
    const futureReminders = uniqueReminders.filter((reminder) => {
      if (!reminder.date || !reminder.time) return false;
      const time24h = convertTo24Hour(reminder.time);
      const reminderTime = new Date(`${reminder.date}T${time24h}`);
      return reminderTime > now;
    });
    futureReminders.forEach((reminder) => {
      const time24h = convertTo24Hour(reminder.time);
      const reminderTime = new Date(`${reminder.date}T${time24h}`);
      const delay = reminderTime - now;
      if (delay > 0) {
        const timer = setTimeout(() => {
          if (alarmActive) return; // Prevent overlapping alarms
          alarmActive = true;
          // Only create one Audio object at a time
          if (alarmAudio) return;
          const audio = new Audio("/alarm.mp3");
          setAlarmAudio(audio);
          setIsAlarmPlaying(true);
          audio.play().catch(() => {});
          // Show notification if allowed
          if (window.Notification && Notification.permission === "granted") {
            new Notification("Alarm", {
              body: `${reminder.title} at ${formatTimeForDisplay(reminder.time)} on ${reminder.date}`,
              icon: "/voice-search.png",
            });
          }
          audio.onended = () => {
            setIsAlarmPlaying(false);
            setAlarmAudio((current) => (current === audio ? null : current));
            alarmActive = false;
          };
        }, delay);
        timers.push(timer);
      }
    });
    // Cleanup timers and audio on unmount or reminders change
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      if (alarmAudio) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
        setAlarmAudio(null);
      }
    };
  }, [uniqueReminders]);

  const handleStopAlarm = () => {
    if (alarmAudio) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    }
    setIsAlarmPlaying(false);
    setAlarmAudio(null);
  };
  React.useEffect(() => {
    speak(
      "Here are your reminders. You can add new ones or listen to existing reminders."
    );
  }, [speak]);

  const handleVoiceReminder = async (voiceInput) => {
    if (!user?.id) {
      speak("Please log in to create voice reminders");
      return;
    }

    setIsVoiceLoading(true);
    setSyncStatus("syncing");

    try {
      const response = await fetch(`${route_endpoint}/format-reminder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          input: voiceInput,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create voice reminder: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.success && data.reminders) {
        speak(data.message || "Voice reminder created successfully");

        // Sync with backend to get the latest reminders including the new one
        await fetchReminders(false); // Don't show loading state
        setSyncStatus("success");
      } else {
        throw new Error(data.error || "Failed to create voice reminder");
      }
    } catch (error) {
      console.error("Error creating voice reminder:", error);
      speak("Sorry, there was an issue creating your voice reminder");
      setSyncStatus("error");
    } finally {
      setIsVoiceLoading(false);
    }
  };

  // Auto-sync when user changes
  useEffect(() => {
    if (user?.id) {
      fetchReminders();
    } else {
      console.error("No user ID available for fetching reminders");
    }
  }, [user?.id]);

  // Sync when window regains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        fetchReminders(false);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user?.id]);

  return (
    <main className="w-full pb-20">
      {/* Show Stop Alarm button if alarm is playing */}
      {isAlarmPlaying && alarmAudio && (
        <div className="fixed top-0 left-0 w-full flex justify-center z-50 px-4">
          <button
            onClick={handleStopAlarm}
            className="bg-accent-orange text-white font-semibold px-4 py-2 sm:px-6 sm:py-3 rounded-b-xl sm:rounded-b-2xl shadow-lg animate-bounce mt-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white text-sm sm:text-lg touch-manipulation dark:bg-accent-orange/90"
            aria-label="Stop Alarm"
          >
            Stop Alarm
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="w-full bg-gradient-to-br from-primary-50 via-primary-100/50 to-accent-yellow/20 dark:from-dark-50 dark:via-dark-100/50 dark:to-accent-yellow/10 backdrop-blur-sm border-b border-primary-100/20 dark:border-dark-600/20">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col items-center text-center gap-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-300 dark:text-primary-100">
              Reminders
            </h1>
            <p className="text-primary-200/80 dark:text-primary-100/60 text-sm sm:text-base max-w-md">
              Manage your daily reminders and stay on track
            </p>
            <div className="flex items-center gap-2 md:gap-6 mt-4 justify-around">
              <Button
                onClick={() => {
                  stop(); // Stop any ongoing speech
                  fetchReminders(true);
                }}
                variant="outline"
                size="lg"
                disabled={isLoading || syncStatus === "syncing"}
                ariaLabel="Refresh reminders"
                className={`${
                  syncStatus === "syncing" ? "animate-pulse" : ""
                } 
                  px-6 py-3 
                  dark:hover:text-white
                  hover:bg-primary-50 dark:hover:bg-dark-200 
                  border-2 border-primary-200/30 dark:border-dark-600/30
                  rounded-xl
                  transition-all duration-300
                  hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-base font-medium
                  flex items-center justify-center gap-2`}
              >
                <div className="flex items-center gap-1 align-middle">
                  <RefreshCw className="w-5 h-5" />
                  <span>Refresh</span>
                </div>
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                variant="primary"
                size="lg"
                ariaLabel="Add reminder"
                className="
                  px-6 py-3
                  bg-gradient-to-r from-primary-300 to-primary-400 
                  dark:from-primary-200 dark:to-primary-300 
                  hover:from-primary-400 hover:to-primary-500 
                  dark:hover:from-primary-300 dark:hover:to-primary-400 
                  text-white 
                  rounded-xl
                  shadow-lg
                  transition-all duration-300
                  hover:shadow-xl
                  focus:ring-2 focus:ring-primary-200/50 dark:focus:ring-primary-100/50
                  text-base font-medium
                  flex items-center justify-center gap-2"
              >
                <div className="flex items-center gap-1">
                  <Plus className="w-5 h-5" />
                  <span>Add Reminder</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="flex-1 w-full max-w-4xl mx-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary-200 dark:border-primary-100"></div>
            <p className="ml-3 sm:ml-4 text-sm sm:text-base text-primary-300 dark:text-primary-100">
              Loading reminders...
            </p>
          </div>
        ) : uniqueReminders.length === 0 ? (
          <div className="text-center py-12 bg-white/50 dark:bg-dark-50/50 rounded-2xl border border-primary-100/20 dark:border-dark-600/20 backdrop-blur-sm mb-10">
            <div className="text-primary-200 dark:text-primary-100 mb-2 text-base sm:text-lg">
              No reminders found
            </div>
            <p className="text-sm text-primary-200/80 dark:text-primary-100/60">
              Add your first reminder to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 py-10">
            {uniqueReminders.map((reminder) => (
              <Card
                key={reminder.created_at}
                className="flex justify-between items-center p-3 xs:p-4 sm:p-5 md:p-6 gap-3 xs:gap-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-dark-50 border border-primary-100/20 dark:border-dark-600/20 hover:scale-[1.02] hover:border-primary-200/40 dark:hover:border-primary-100/40 rounded-xl sm:rounded-2xl"
              >
                <div className="flex gap-2 xs:gap-3 sm:gap-4 md:gap-5 items-center flex-1 min-w-0">
                  <div className="bg-gradient-to-br from-primary-100/30 to-accent-yellow/30 dark:from-primary-100/20 dark:to-accent-yellow/20 rounded-full p-2 xs:p-3 sm:p-4 flex-shrink-0 border border-primary-100/30 dark:border-primary-100/20">
                    <Clock
                      className="text-primary-300 dark:text-primary-100 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 xs:gap-1 sm:gap-2 flex-1 min-w-0">
                    <h3 className="font-semibold text-sm xs:text-base sm:text-lg md:text-xl text-primary-300 dark:text-primary-100 break-words leading-tight line-clamp-1">
                      {reminder.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 xs:gap-2 text-xs xs:text-sm sm:text-base text-primary-200/80 dark:text-primary-100/70">
                      <span className="inline-block font-medium">
                        {formatDate(reminder.date, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="text-primary-100/60 dark:text-primary-100/40">
                        |
                      </span>
                      <span className="inline-block font-medium">{formatTimeForDisplay(reminder.time)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 xs:gap-2 sm:gap-3 items-center flex-shrink-0">
                  <Button
                    onClick={() => handleReadReminder(reminder)}
                    variant="outline"
                    size="sm"
                    ariaLabel="Read reminder"
                    className="flex justify-center items-center hover:bg-primary-100/20 dark:hover:bg-primary-100 border-primary-200/30 dark:border-primary-100/30 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg xs:rounded-xl transition-all duration-300 touch-manipulation"
                  >
                    <Volume2 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </Button>
                  
                  <Button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    variant="danger"
                    size="sm"
                    ariaLabel="Delete reminder"
                    className="flex justify-center items-center bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 border-red-500/30 dark:border-red-600/30 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg xs:rounded-xl transition-all duration-300 touch-manipulation"
                  >
                    <Trash2 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        {/* Add Reminder Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4 sm:p-6">
            <div className="bg-white/95 dark:bg-dark-50/95 rounded-xl xs:rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-[90vw] xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto transform animate-in fade-in zoom-in-95 duration-200 border border-primary-100/20 dark:border-dark-600/20 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
              <div className="p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 xs:mb-5 sm:mb-6 md:mb-7 lg:mb-8 text-primary-300 dark:text-primary-100 text-center">
                  Add Reminder
                </h2>

                <div className="space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-7 lg:space-y-8">
                  <div className="space-y-1 xs:space-y-1.5 sm:space-y-2">
                    <Input
                      label="Title"
                      value={newReminder.title}
                      onChange={(e) =>
                        setNewReminder({ ...newReminder, title: e.target.value })
                      }
                      required
                      placeholder="Enter reminder title"
                      className="w-full dark:bg-dark-200 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl p-3 xs:p-4 sm:p-5 md:p-6 lg:p-7 rounded-lg xs:rounded-xl sm:rounded-2xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8">
                    <div className="space-y-1 xs:space-y-1.5 sm:space-y-2">
                      <Input
                        label="Date"
                        type="date"
                        value={newReminder.date}
                        onChange={(e) =>
                          setNewReminder({ ...newReminder, date: e.target.value })
                        }
                        required
                        className="w-full dark:bg-dark-200 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl p-3 xs:p-4 sm:p-5 md:p-6 lg:p-7 rounded-lg xs:rounded-xl sm:rounded-2xl"
                      />
                    </div>

                    <div className="space-y-1 xs:space-y-1.5 sm:space-y-2">
                      <Input
                        label="Time"
                        type="time"
                        value={convertTo24Hour(newReminder.time)}
                        onChange={(e) => {
                          const time24h = e.target.value;
                          const time12h = formatTimeForDisplay(time24h);
                          setNewReminder({ ...newReminder, time: time12h });
                        }}
                        required
                        className="w-full dark:bg-dark-200 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl p-3 xs:p-4 sm:p-5 md:p-6 lg:p-7 rounded-lg xs:rounded-xl sm:rounded-2xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col xs:flex-col sm:flex-row gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-7 mt-6 xs:mt-7 sm:mt-8 md:mt-9 lg:mt-10">
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="outline"
                    size="md"
                    ariaLabel="Cancel"
                    className="w-full sm:w-auto order-2 sm:order-1 dark:hover:bg-dark-200 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl py-3 xs:py-4 sm:py-5 md:py-6 lg:py-7 px-6 xs:px-7 sm:px-8 md:px-9 lg:px-10 rounded-lg xs:rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:scale-105 touch-manipulation"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddReminder}
                    variant="primary"
                    size="md"
                    ariaLabel="Add reminder"
                    className="w-full sm:w-auto order-1 sm:order-2 dark:bg-dark-300 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl py-3 xs:py-4 sm:py-5 md:py-6 lg:py-7 px-6 xs:px-7 sm:px-8 md:px-9 lg:px-10 rounded-lg xs:rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation shadow-lg hover:shadow-xl"
                    disabled={
                      !newReminder.title ||
                      !newReminder.time ||
                      !newReminder.date
                    }
                  >
                    Add Reminder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
