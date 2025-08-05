import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  Phone,
  MapPin,
  Shield,
  Activity,
  Upload,
  Camera,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { VoiceButton } from "../components/voice/VoiceButton";
import { useApp } from "../context/AppContext";
import { useVoice } from "../hooks/useVoice";

export function UserDetails() {
  const navigate = useNavigate();
  const { user, setUser, updateUser, loading } = useApp();
  const { speak } = useVoice();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // Step state
  const [subStep, setSubStep] = useState(0); // For emergency contacts
  const [isPreFilled, setIsPreFilled] = useState(false); // Track if form is pre-filled with existing data
  const [fileInputKeys, setFileInputKeys] = useState({
    medicalReport: Date.now(),
    profilePicture: Date.now(),
  }); // Force file input re-render on errors

  // Bulletproof upload state management with atomic operations
  const [uploadStates, setUploadStates] = useState({
    medicalReport: {
      isUploading: false,
      progress: 0,
      controller: null,
      stage: "idle", // idle, validating, processing, uploading, complete, error, cancelled
      error: null,
      operationId: null,
    },
    profilePicture: {
      isUploading: false,
      progress: 0,
      controller: null,
      stage: "idle",
      error: null,
      operationId: null,
    },
  });

  // Simple upload tracking - no complex refs needed
  const uploadInProgress = React.useRef({
    medicalReport: false,
    profilePicture: false,
  });

  // Show loading state if user data is not yet available
  if (loading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    age: "",
    gender: "",
    address: "",
    emergencyContacts: [
      { name: "", number: "" },
      { name: "", number: "" },
    ],
    healthCondition: { selected: "", custom: "" },
    currentMedicalStatus: "",
    medicalReport: null,
    profilePicture: null,
  });

  // Options for dropdowns
  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
  const healthConditionOptions = [
    "Heart Disease",
    "Cancer",
    "Tuberculosis (TB)",
    "Diabetes",
    "High Blood Pressure",
    "Asthma",
    "None",
  ];
  const medicalStatusOptions = [
    "Stable",
    "Under Treatment",
    "Critical",
    "Recovering",
    "Chronic",
  ];

  // Step progress bar
  const steps = [
    "Age & Gender",
    "Address",
    "Emergency Contact",
    "Health & Status",
    "Medical Report",
    "Profile Picture",
  ];

  useEffect(() => {
    if (user) {

      // Check if user has existing profile data
      const hasExistingData =
        user.age ||
        user.gender ||
        user.address ||
        user.healthCondition ||
        user.currentMedicalStatus;
      setIsPreFilled(hasExistingData);

      setFormData({
        name: user.name || "",
        age: user.age || "",
        gender: user.gender || "",
        address: user.address || "",
        emergencyContacts:
          user.emergencyContacts && user.emergencyContacts.length > 0
            ? user.emergencyContacts
            : [
                { name: "", number: "" },
                { name: "", number: "" },
              ],
        healthCondition: {
          selected: user.healthCondition || "",
          custom: "",
        },
        currentMedicalStatus: user.currentMedicalStatus || "",
        medicalReport: user.medicalReport || null,
        profilePicture: user.profilePicture || null,
      });
    }
  }, [user]);

  // Welcome message effect
  useEffect(() => {
    speak("Please provide your medical information.");
  }, [speak]);

  // Enhanced cleanup effect to handle unmounting and cancel uploads
  useEffect(() => {
    return () => {
      // Clear all upload progress flags
      uploadInProgress.current.medicalReport = false;
      uploadInProgress.current.profilePicture = false;
    };
  }, []); // Empty dependency array ensures this only runs on unmount

  // Read step titles aloud
  useEffect(() => {
    const titles = [
      "",
      "Enter Your Age & Gender",
      "Enter Your Address", 
      "Enter Emergency Contact",
      "Enter Health & Status",
      "Upload Medical Report",
      "Upload Profile Picture"
    ];
    if (titles[step]) speak(titles[step]);
  }, [step, speak]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle emergency contact changes
  const handleEmergencyContactChange = (index, field, value) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts[index][field] = value;
    setFormData((prev) => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  // Handle health condition selection
  const handleHealthConditionChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      healthCondition: {
        ...prev.healthCondition,
        selected: value,
        custom: value === "Other" ? prev.healthCondition.custom : "",
      },
    }));
  };

  // Handle voice input for different fields
  const handleVoiceInput = (field) => (text) => {
    switch (field) {
      case "age":
        // Extract numbers from voice input
        const ageMatch = text.match(/\d+/);
        if (ageMatch) {
          setFormData((prev) => ({ ...prev, age: ageMatch[0] }));
        }
        break;
      case "address":
        setFormData((prev) => ({ ...prev, address: text }));
        break;
      case "emergencyContactName":
        handleEmergencyContactChange(subStep, "name", text);
        break;
      case "emergencyContactNumber":
        // Extract phone number patterns
        const cleanedNumber = text.replace(/\D/g, ""); // Remove non-digits
        if (cleanedNumber.length >= 10) {
          handleEmergencyContactChange(subStep, "number", cleanedNumber);
        } else {
          handleEmergencyContactChange(subStep, "number", text);
        }
        break;
      case "healthConditionCustom":
        setFormData((prev) => ({
          ...prev,
          healthCondition: {
            ...prev.healthCondition,
            custom: text,
          },
        }));
        break;
      default:
        break;
    }
  };

  // Enhanced cancel upload function with simplified operation tracking
  const cancelUpload = (field) => {

    // Mark as not in progress
    uploadInProgress.current[field] = false;

    // Reset upload state
    setUploadStates((prev) => ({
      ...prev,
      [field]: {
        isUploading: false,
        progress: 0,
        controller: null,
        stage: "idle",
        error: null,
        operationId: null,
      },
    }));

    // Clear file data from form
    setFormData((prev) => ({ ...prev, [field]: null }));

    // Clear any existing errors
    setError("");

    // Force file input re-render and reset
    setFileInputKeys(prev => ({
      ...prev,
      [field]: Date.now()
    }));

    // Reset file input immediately
    const fileInput = document.getElementById(field);
    if (fileInput) {
      fileInput.value = "";
    }

    const fieldName = field === "medicalReport" ? "Medical report" : "Profile picture";
    speak(`${fieldName} upload cancelled.`);
  };

  // Enhanced remove uploaded file function with simplified check
  const removeFile = (field) => {
    // Ensure no upload is in progress before removing
    if (uploadInProgress.current[field]) {
      
      return;
    }

    // Clear file data from form atomically
    setFormData((prev) => {
      const newData = { ...prev, [field]: null };
      return newData;
    });

    // Reset upload state
    setUploadStates((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        stage: "idle",
        error: null,
        progress: 0,
        operationId: null,
      },
    }));

    // Clear any existing errors
    setError("");

    // Reset file input immediately
    const fileInput = document.getElementById(field);
    if (fileInput) {
      fileInput.value = "";
    }

    const fieldName = field === "medicalReport" ? "Medical report" : "Profile picture";
    speak(`${fieldName} removed.`);
  };

  // Enhanced smart compression function with error handling and quality optimization
  const compressImage = (
    file,
    maxWidth = 800,
    quality = 0.7,
    maxSizeKB = 300
  ) => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        // Timeout for image loading
        const loadTimeout = setTimeout(() => {
          reject(new Error("Image loading timeout"));
        }, 10000); // 10 second timeout

        img.onload = () => {
          clearTimeout(loadTimeout);

          try {
            // Calculate optimal dimensions maintaining aspect ratio
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            const newWidth = Math.floor(img.width * ratio);
            const newHeight = Math.floor(img.height * ratio);

            canvas.width = newWidth;
            canvas.height = newHeight;

            // Use high-quality scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Draw image with optimal settings
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Progressive quality reduction until target size is met
            const tryCompress = (currentQuality) => {
              if (currentQuality <= 0.1) {
                // If we can't compress enough, resolve with current result
                canvas.toBlob(
                  (blob) => {
                    if (blob) {
                      resolve(blob);
                    } else {
                      reject(new Error("Failed to create compressed blob"));
                    }
                  },
                  "image/jpeg",
                  0.1
                );
                return;
              }

              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(
                      new Error("Failed to create blob during compression")
                    );
                    return;
                  }

                  const sizeKB = blob.size / 1024;

                  if (sizeKB <= maxSizeKB) {
                    // Target size achieved
                    resolve(blob);
                  } else {
                    // Continue compressing with lower quality
                    tryCompress(currentQuality - 0.1);
                  }
                },
                "image/jpeg",
                currentQuality
              );
            };

            // Start compression process
            tryCompress(quality);
          } catch (canvasError) {
            console.error("Canvas processing error:", canvasError);
            reject(
              new Error(`Canvas processing failed: ${canvasError.message}`)
            );
          }
        };

        img.onerror = (imgError) => {
          clearTimeout(loadTimeout);
          console.error("Image loading error:", imgError);
          reject(new Error("Failed to load image for compression"));
        };

        // Start image loading
        img.src = URL.createObjectURL(file);
      } catch (error) {
        console.error("Compression setup error:", error);
        reject(new Error(`Compression setup failed: ${error.message}`));
      }
    });
  };

  // Simple and bulletproof file upload handler with debounce
  const handleFileUpload = React.useCallback(async (field, file) => {
    if (!file) {
      
      return;
    }

    // Triple check to prevent any duplicates
    if (uploadInProgress.current[field]) {
      
      return;
    }

    if (uploadStates[field].isUploading) {
      
      return;
    }

    // Immediately lock all possible entry points
    uploadInProgress.current[field] = true;

    

    // Update UI state immediately
    setUploadStates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        isUploading: true,
        progress: 10,
        stage: "validating",
        error: null,
      }
    }));

    // Clear any existing errors
    setError("");

    try {
      // File validation with detailed logging
      
      
      if (field === "medicalReport") {
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
          throw new Error("Please upload a PDF or image file for medical report.");
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Medical report file size should be less than 10MB.");
        }
      } else if (field === "profilePicture") {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
          throw new Error("Please upload a JPEG or PNG image for profile picture.");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Profile picture file size should be less than 5MB.");
        }
      }

      

      // Update progress
      setUploadStates(prev => ({
        ...prev,
        [field]: { ...prev[field], progress: 30, stage: "processing" }
      }));

      // Convert to base64 with error handling
      
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          
          resolve(e.target.result);
        };
        reader.onerror = () => {
          console.error(`Base64 conversion failed for ${field}`);
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(file);
      });

      // Check size and compress if needed
      const estimatedSize = base64Data.length;
      
      
      let processedFile = file;
      let finalBase64Data = base64Data;
      let compressionApplied = false;
      let compressionStats = null;

      // Update progress
      setUploadStates(prev => ({
        ...prev,
        [field]: { ...prev[field], progress: 50, stage: "analyzing" }
      }));

      // Compress if needed
      if (estimatedSize > 380000 && file.type.startsWith("image/")) {
        
        
        setUploadStates(prev => ({
          ...prev,
          [field]: { ...prev[field], progress: 70, stage: "compressing" }
        }));

        const compressionSettings = field === "profilePicture"
          ? { maxWidth: 400, quality: 0.6, maxSizeKB: 220 }
          : { maxWidth: 800, quality: 0.7, maxSizeKB: 280 };

        processedFile = await compressImage(
          file,
          compressionSettings.maxWidth,
          compressionSettings.quality,
          compressionSettings.maxSizeKB
        );

        

        finalBase64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error("Failed to read compressed file"));
          reader.readAsDataURL(processedFile);
        });

        compressionApplied = true;
        compressionStats = {
          originalSize: file.size,
          compressedSize: processedFile.size,
          ratio: (((file.size - processedFile.size) / file.size) * 100).toFixed(1),
        };
      }

      // Final size check
      if (finalBase64Data.length > 380000) {
        throw new Error("File still too large after compression. Please use a smaller file.");
      }

      

      // Update progress
      setUploadStates(prev => ({
        ...prev,
        [field]: { ...prev[field], progress: 90, stage: "finalizing" }
      }));

      // Create file data
      const fileData = {
        name: file.name,
        originalSize: file.size,
        compressedSize: processedFile.size || file.size,
        type: file.type,
        data: finalBase64Data,
        lastModified: file.lastModified,
        uploadedAt: new Date().toISOString(),
        compressed: compressionApplied,
        compressionRatio: compressionApplied ? compressionStats.ratio : 0,
      };

      // Update form data
      setFormData(prev => {
        
        return { ...prev, [field]: fileData };
      });

      // Success state
      setUploadStates(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          progress: 100,
          stage: "complete",
          isUploading: false,
        }
      }));

      const successMessage = compressionApplied
        ? `${field === "medicalReport" ? "Medical report" : "Profile picture"} uploaded and optimized successfully (${fileData.compressionRatio}% size reduction).`
        : `${field === "medicalReport" ? "Medical report" : "Profile picture"} uploaded successfully.`;

      
      speak(successMessage);

    } catch (error) {
      console.error(`Upload failed for ${field}:`, error.message);

      // Error state
      setUploadStates(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          isUploading: false,
          progress: 0,
          stage: "error",
          error: error.message,
        }
      }));

      // Clear form data on error
      setFormData(prev => ({ ...prev, [field]: null }));

      // Show error
      setError(`Upload failed: ${error.message}`);
      speak(`Failed to upload ${field === "medicalReport" ? "medical report" : "profile picture"}. ${error.message}`);

      // Reset file input with new key
      setFileInputKeys(prev => ({ ...prev, [field]: Date.now() }));
      
      // Clear file input after a short delay to ensure the key update takes effect
      setTimeout(() => {
        const fileInput = document.getElementById(field);
        if (fileInput) {
          fileInput.value = "";
          
        }
      }, 100);
    } finally {
      // Always clear the progress flag
      
      uploadInProgress.current[field] = false;
    }
  }, [uploadStates, speak]);

  // Enhanced Upload Progress Component with better stage tracking
  const UploadProgress = ({ field, uploadState, onCancel }) => {
    const { isUploading, progress, stage, operationId } = uploadState;

    if (!isUploading) return null;

    const stageMessages = {
      idle: "Ready to upload",
      validating: "Validating file...",
      validated: "File validated",
      analyzing: "Analyzing file size...",
      compressing: "Optimizing file size...",
      "validating compressed": "Validating optimized file...",
      preparing: "Preparing for upload...",
      finalizing: "Finalizing upload...",
      complete: "Upload complete!",
      error: "Upload failed",
      cancelled: "Upload cancelled",
    };

    const getStageIcon = (stage) => {
      switch (stage) {
        case "complete":
          return (
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
          );
        case "error":
          return (
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
          );
        case "cancelled":
          return (
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
          );
        default:
          return (
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          );
      }
    };

    const getProgressColor = (stage) => {
      if (stage === "error") return "bg-red-600";
      if (stage === "cancelled") return "bg-gray-600";
      if (stage === "complete") return "bg-green-600";
      return "bg-blue-600";
    };

    return (
      <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded border border-blue-200 w-full overflow-hidden">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getStageIcon(stage)}
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-medium text-blue-700 truncate block">
                {stageMessages[stage] || stage}
              </span>
              {operationId && (
                <span className="text-xs text-blue-500 opacity-75 truncate block">
                  ID: {operationId.split("_")[2]}
                </span>
              )}
            </div>
          </div>
          {stage !== "complete" &&
            stage !== "error" &&
            stage !== "cancelled" && (
              <button
                onClick={() => onCancel(field)}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium bg-red-50 hover:bg-red-100 rounded transition-colors duration-200 flex-shrink-0"
                aria-label="Cancel upload"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            )}
        </div>

        <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ease-out ${getProgressColor(
              stage
            )}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-blue-600 gap-2">
          <span className="truncate">{progress}% complete</span>
          <span className="capitalize truncate">{stage.replace("_", " ")}</span>
        </div>
      </div>
    );
  };

  // File Preview Component
  const FilePreview = ({ field, fileData, onRemove }) => {
    const isImage = fileData.type.startsWith("image/");
    const sizeInMB = (fileData.compressedSize / (1024 * 1024)).toFixed(2);

    return (
      <div className="mt-3 p-3 sm:p-4 bg-green-50 rounded border border-green-200 w-full overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {isImage && fileData.data ? (
              <img
                src={fileData.data}
                alt="Preview"
                className={`object-cover border-2 border-green-200 flex-shrink-0 ${
                  field === "profilePicture"
                    ? "w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                    : "w-10 h-10 sm:w-12 sm:h-12 rounded"
                }`}
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-green-700 font-medium text-xs sm:text-sm truncate">
                {fileData.name}
              </p>
              <p className="text-green-600 text-xs">
                <span className="truncate">Size: {sizeInMB} MB</span>
                {fileData.compressed && (
                  <span className="block sm:inline sm:ml-2 text-green-700 font-medium">
                    (Compressed {fileData.compressionRatio}%)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-1 sm:p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200 flex-shrink-0"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Enhanced File Upload Card Component with debounced file handling
  const FileUploadCard = ({
    field,
    title,
    description,
    accept,
    icon: Icon,
    formData,
    uploadState,
    onFileSelect,
    onCancel,
    onRemove,
    fileInputKey,
  }) => {
    const hasFile = formData[field] && formData[field].data;
    const { isUploading } = uploadState;

    // Debounced file change handler to prevent multiple rapid calls
    const handleFileChange = React.useCallback(
      React.useMemo(
        () => {
          let timeoutId = null;
          return (e) => {
            const file = e.target.files[0];
            
            
            // Clear any existing timeout
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            
            // Debounce the file selection to prevent rapid calls
            timeoutId = setTimeout(() => {
              if (file && !uploadInProgress.current[field]) {
                
                onFileSelect(field, file);
              } else if (uploadInProgress.current[field]) {
                
              }
            }, 200); // 200ms debounce
          };
        },
        [field, onFileSelect]
      ),
      [field, onFileSelect]
    );

    return (
      <div className="w-full border-2 border-dashed border-gray-300 rounded p-4 sm:p-6 text-center bg-white hover:border-blue-400 transition-colors duration-300 overflow-hidden">
        {!hasFile && !isUploading && (
          <>
            <input
              type="file"
              id={field}
              key={fileInputKey} // Force re-render on error
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              disabled={uploadInProgress.current[field]}
            />
            <label
              htmlFor={field}
              className="cursor-pointer flex flex-col items-center gap-2 sm:gap-3 w-full"
            >
              <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
              <div className="w-full">
                <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1">
                  {title}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 px-2 leading-relaxed">
                  {description}
                </p>
              </div>
            </label>
          </>
        )}

        {isUploading && (
          <UploadProgress
            field={field}
            uploadState={uploadState}
            onCancel={onCancel}
          />
        )}

        {hasFile && !isUploading && (
          <FilePreview
            field={field}
            fileData={formData[field]}
            onRemove={() => onRemove(field)}
          />
        )}
      </div>
    );
  };

  // Step navigation with validation
  const validateStep = () => {
    if (step === 1) {
      const age = parseInt(formData.age, 10);
      return formData.age && age > 0 && age <= 150 && formData.gender;
    }
    if (step === 2) {
      return formData.address.trim();
    }
    if (step === 3) {
      const contact = formData.emergencyContacts[subStep];
      return contact.name.trim() && contact.number.trim();
    }
    if (step === 4) {
      if (formData.healthCondition.selected === "Other") {
        return (
          formData.healthCondition.custom.trim() &&
          formData.currentMedicalStatus.trim()
        );
      }
      return (
        formData.healthCondition.selected &&
        formData.currentMedicalStatus.trim()
      );
    }
    if (step === 5) {
      // Medical report is optional, so always return true
      return true;
    }
    if (step === 6) {
      // Profile picture is optional, so always return true
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setError(""); // Clear any existing errors when moving to next step
    if (step === 3 && subStep < 1) {
      setSubStep(subStep + 1);
    } else {
      setStep(step + 1);
      setSubStep(0);
    }
  };
  const prevStep = () => {
    setError(""); // Clear any existing errors when moving to previous step
    if (step === 3 && subStep > 0) {
      setSubStep(subStep - 1);
    } else if (step > 1) {
      setStep(step - 1);
      if (step === 4) setSubStep(1); // Go back to last emergency contact
    }
  };

  // Enhanced form submission with timeout handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(""); // Clear any existing errors when submitting

    // Create submission timeout to prevent infinite loading
    const submissionTimeout = setTimeout(() => {
      console.error("Form submission timeout after 30 seconds");
      setIsLoading(false);
      setError(
        "Request timeout: The submission took too long. Please check your internet connection and try again."
      );
      speak("Form submission timeout. Please try again.");
    }, 40000); // 40 second timeout

    try {
      if (!user || !user.id) {
        throw new Error("User not authenticated");
      }

      // Prepare cleaned data - all files stored directly in Firestore
      const cleanedFormData = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age, 10) || 0 : 0,
        gender: formData.gender.trim(),
        address: formData.address.trim(),
        emergencyContacts: formData.emergencyContacts
          .filter((contact) => contact.name.trim() && contact.number.trim())
          .map((contact) => ({
            name: contact.name.trim(),
            number: contact.number.trim(),
          })),
        healthCondition:
          formData.healthCondition.selected === "Other"
            ? formData.healthCondition.custom.trim()
            : formData.healthCondition.selected,
        currentMedicalStatus: formData.currentMedicalStatus.trim(),
        medicalReport:
          formData.medicalReport &&
          typeof formData.medicalReport === "object" &&
          formData.medicalReport.data
            ? formData.medicalReport
            : null,
        profilePicture:
          formData.profilePicture &&
          typeof formData.profilePicture === "object" &&
          formData.profilePicture.data
            ? formData.profilePicture
            : null,
      };

      // Calculate total document size to ensure it's under Firestore limits
      const estimatedSize = JSON.stringify(cleanedFormData).length;

      if (estimatedSize > 800000) {
        // 800KB safety limit (Firestore max is 1MB)
        throw new Error(
          "Profile data is too large even after compression. Please use smaller files or remove some data."
        );
      }

      // Create a promise race with timeout for the updateUser call
      const updatePromise = updateUser(cleanedFormData);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Update operation timed out after 30 seconds"));
        }, 30000); // 30 second timeout for the actual update
      });

      // Wait for either the update to complete or timeout
      await Promise.race([updatePromise, timeoutPromise]);

      // Clear the submission timeout since we completed successfully
      clearTimeout(submissionTimeout);

      // Success message with smart compression info
      let successMessage =
        "Your medical information has been saved successfully.";
      const files = [
        cleanedFormData.medicalReport,
        cleanedFormData.profilePicture,
      ].filter(Boolean);
      const compressedFiles = files.filter((f) => f.compressed);
      const uncompressedFiles = files.filter((f) => !f.compressed);

      if (compressedFiles.length > 0 && uncompressedFiles.length > 0) {
        successMessage +=
          " Some files were compressed for optimal storage while others were uploaded as-is.";
      } else if (compressedFiles.length > 0) {
        successMessage +=
          " Files were automatically compressed for optimal storage.";
      } else if (uncompressedFiles.length > 0) {
        successMessage += " Files were uploaded in their original quality.";
      }

      speak(successMessage + " Redirecting to your profile.");

      // Small delay to ensure context update propagates
      setTimeout(() => {
        // Navigate to profile page to show updated data
        navigate("/home");
      }, 500);
    } catch (error) {
      // Clear the submission timeout on error
      clearTimeout(submissionTimeout);

      console.error("Form submission error:", {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      speak("Failed to save your information. Please try again.");

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to save information. Please try again.";

      if (error.message.includes("User not authenticated")) {
        errorMessage = "You are not logged in. Please login again.";
        setTimeout(() => navigate("/login"), 2000);
      } else if (error.message.includes("permission-denied")) {
        errorMessage =
          "Permission denied. Please check your authentication and try again.";
      } else if (
        error.message.includes("network") ||
        error.message.includes("unavailable")
      ) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (
        error.message.includes("deadline-exceeded") ||
        error.message.includes("timed out")
      ) {
        errorMessage =
          "Request timeout. The operation took too long. Please check your connection and try again.";
      } else if (error.message.includes("unauthenticated")) {
        errorMessage = "Authentication expired. Please log in again.";
        setTimeout(() => navigate("/login"), 2000);
      } else if (error.message.includes("exceeds the maximum allowed size")) {
        errorMessage =
          "Files are too large even after compression. Please upload smaller files with lower resolution.";
      } else if (error.message.includes("quota-exceeded")) {
        errorMessage =
          "Storage quota exceeded. Please contact support or try with smaller files.";
      } else if (error.message.includes("Profile data is too large")) {
        errorMessage = error.message; // Use the specific size error message
      } else {
        errorMessage = `Failed to save information: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      // Always clear loading state and timeout
      clearTimeout(submissionTimeout);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 flex items-center justify-center p-2 sm:p-4 text-gray-900">
      {/* Progress bar (show only current step on mobile) */}
      <div className="fixed top-0 left-0 w-full z-40 bg-white py-2 px-1 sm:py-3 sm:px-4 flex items-center justify-center gap-1 sm:gap-2 border-b">
        <div className="flex-1 flex flex-col items-center sm:hidden">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-base bg-blue-600">
            {step}
          </div>
          <span className="text-[10px] mt-1 font-medium text-blue-700">
            {steps[step - 1]}
          </span>
        </div>
        <div className="hidden sm:flex w-full gap-2">
          {steps.map((label, idx) => (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-white text-base sm:text-lg transition-all duration-300 ${
                  step === idx + 1
                    ? "bg-blue-600"
                    : step > idx + 1
                    ? "bg-green-400"
                    : "bg-gray-300"
                }`}
              >
                {idx + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs mt-1 font-medium text-center ${
                  step === idx + 1 ? "text-blue-700" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="bg-white rounded-lg border p-4 sm:p-8 my-10">
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              // Prevent form submission by Enter
              if (e.key === "Enter") {
                // Do not submit form at all
                e.preventDefault();
                return false;
              }
            }}
            className="space-y-8 sm:space-y-10 text-gray-900"
          >
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">
                      {error.includes("timeout") || error.includes("Network")
                        ? "Submission Error"
                        : "Upload Error"}
                    </p>
                    <p className="text-red-700 mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => setError("")}
                    className="ml-3 text-red-400 hover:text-red-600 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {/* Step 1: Age & Gender */}
            {step === 1 && (
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" /> Your
                  Age & Gender
                </h2>
                <div className="relative flex items-center min-w-0">
                  <Input
                    type="number"
                    label="Age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    icon={Calendar}
                    min="1"
                    max="120"
                    required
                    className="pr-14 sm:pr-16 md:pr-20 min-w-0 bg-white/60"
                  />
                  <div className="absolute inset-y-0 right-4 top-4 flex items-center pointer-events-auto">
                    <VoiceButton
                      onResult={handleVoiceInput("age")}
                      size="sm"
                      className="!w-9 sm:!w-10"
                      type="button"
                      tabIndex={-1}
                    />
                  </div>
                </div>
                <div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 rounded-xl transition-all duration-300 shadow-sm bg-white/60"
                    required
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4 sm:mt-6">
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep()}
                    className="bg-blue-600 text-white px-6 py-2 rounded w-full sm:w-auto"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            {/* Step 2: Address */}
            {step === 2 && (
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />{" "}
                  Your Address
                </h2>
                <div className="relative flex items-center min-w-0">
                  <Input
                    type="text"
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    icon={MapPin}
                    required
                    className="pr-14 sm:pr-16 md:pr-20 min-w-0 bg-white/60"
                  />
                  <div className="absolute inset-y-0 right-4 top-4 flex items-center pointer-events-auto">
                    <VoiceButton
                      onResult={handleVoiceInput("address")}
                      size="sm"
                      className="!w-9 sm:!w-10"
                      type="button"
                      tabIndex={-1}
                    />
                  </div>
                </div>
                <div className="flex justify-between gap-2 mt-4 sm:mt-6">
                  <Button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            {/* Step 3: Emergency Contact (one at a time) */}
            {step === 3 && (
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />{" "}
                  Emergency Contact
                </h2>
                <div className="relative flex items-center min-w-0">
                  <Input
                    type="text"
                    label={`Contact Name (${subStep + 1})`}
                    value={formData.emergencyContacts[subStep].name}
                    onChange={(e) =>
                      handleEmergencyContactChange(
                        subStep,
                        "name",
                        e.target.value
                      )
                    }
                    icon={User}
                    required
                    className="pr-14 sm:pr-16 md:pr-20 min-w-0 bg-white/60"
                  />
                  <div className="absolute inset-y-0 right-4 top-4 flex items-center pointer-events-auto">
                    <VoiceButton
                      onResult={handleVoiceInput("emergencyContactName")}
                      size="sm"
                      className="!w-9 sm:!w-10"
                      type="button"
                      tabIndex={-1}
                    />
                  </div>
                </div>
                <div className="relative flex items-center min-w-0">
                  <Input
                    type="tel"
                    label={`Contact Number (${subStep + 1})`}
                    value={formData.emergencyContacts[subStep].number}
                    onChange={(e) =>
                      handleEmergencyContactChange(
                        subStep,
                        "number",
                        e.target.value
                      )
                    }
                    icon={Phone}
                    required
                    className="pr-14 sm:pr-16 md:pr-20 min-w-0 bg-white/60"
                  />
                  <div className="absolute inset-y-0 right-4 top-4 flex items-center pointer-events-auto">
                    <VoiceButton
                      onResult={handleVoiceInput("emergencyContactNumber")}
                      size="sm"
                      className="!w-9 sm:!w-10"
                      type="button"
                      tabIndex={-1}
                    />
                  </div>
                </div>
                <div className="flex justify-between gap-2 mt-4 sm:mt-6">
                  <Button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto"
                  >
                    {subStep === 1 ? "Next" : "Next Contact"}
                  </Button>
                </div>
              </div>
            )}
            {/* Step 4: Health Condition & Status */}
            {step === 4 && (
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />{" "}
                  Health & Status
                </h2>
                <div>
                  <select
                    value={formData.healthCondition.selected}
                    onChange={handleHealthConditionChange}
                    className="w-full p-4 border border-gray-200 rounded-xl transition-all duration-300 shadow-sm bg-white/60"
                    required
                  >
                    <option value="">Select Your Health Condition</option>
                    {healthConditionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
                {formData.healthCondition.selected === "Other" && (
                  <div className="relative flex items-center min-w-0">
                    <Input
                      type="text"
                      label="Specify Condition"
                      value={formData.healthCondition.custom}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          healthCondition: {
                            ...prev.healthCondition,
                            custom: e.target.value,
                          },
                        }))
                      }
                      required
                      className="pr-14 sm:pr-16 md:pr-20 min-w-0 bg-white/60"
                    />
                    <div className="absolute inset-y-0 right-4 top-4 flex items-center pointer-events-auto">
                      <VoiceButton
                        onResult={handleVoiceInput("healthConditionCustom")}
                        size="sm"
                        className="!w-9 sm:!w-10"
                        type="button"
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <select
                    name="currentMedicalStatus"
                    value={formData.currentMedicalStatus}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-200 rounded-xl transition-all duration-300 shadow-sm bg-white/60"
                    required
                  >
                    <option value="">Select Status</option>
                    {medicalStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between gap-2 mt-4 sm:mt-6">
                  <Button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Medical Report Upload */}
            {step === 5 && (
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />{" "}
                  Medical Report (Optional)
                </h2>

                <FileUploadCard
                  field="medicalReport"
                  title="Upload Medical Report"
                  description="PDF, JPEG, PNG files (Max 10MB) - Auto-compressed if needed"
                  accept=".pdf,.jpg,.jpeg,.png"
                  icon={Upload}
                  formData={formData}
                  uploadState={uploadStates.medicalReport}
                  onFileSelect={handleFileUpload}
                  onCancel={cancelUpload}
                  onRemove={removeFile}
                  fileInputKey={fileInputKeys.medicalReport}
                />

                <div className="flex justify-between gap-2 mt-4 sm:mt-6">
                  <Button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Profile Picture Upload */}
            {step === 6 && (
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />{" "}
                  Profile Picture (Optional)
                </h2>

                <FileUploadCard
                  field="profilePicture"
                  title="Upload Profile Picture"
                  description="JPEG, PNG files (Max 5MB) - Auto-compressed if needed"
                  accept=".jpg,.jpeg,.png"
                  icon={Camera}
                  formData={formData}
                  uploadState={uploadStates.profilePicture}
                  onFileSelect={handleFileUpload}
                  onCancel={cancelUpload}
                  onRemove={removeFile}
                  fileInputKey={fileInputKeys.profilePicture}
                />

                <div className="flex justify-between gap-2 mt-4 sm:mt-6">
                  <Button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isLoading ||
                      uploadStates.medicalReport.isUploading ||
                      uploadStates.profilePicture.isUploading
                    }
                    className="bg-green-600 text-white px-6 py-2 rounded-xl shadow w-1/2 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Saving..." : "Complete Setup"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
