import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import "./ImageUpload.css";

/**
 * Modern Image Upload Component with Progress Bar
 *
 * Features:
 * - Single input field for up to 4 images
 * - Drag & drop support
 * - Animated 4-segment progress bar
 * - Image preview with remove functionality
 * - Validation (5MB max, image formats only)
 */
export default function ImageUpload({
  onImagesChange,
  maxImages = 4,
  maxSizeMB = 5,
}) {
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  /**
   * Validate a single file
   */
  const validateFile = (file) => {
    if (!validTypes.includes(file.type)) {
      return `${file.name} is not a valid image format. Use JPG, PNG, or WebP.`;
    }
    if (file.size > maxSizeBytes) {
      return `${file.name} exceeds ${maxSizeMB}MB limit.`;
    }
    return null;
  };

  /**
   * Process and add new files
   */
  const processFiles = useCallback(
    (files) => {
      const fileArray = Array.from(files);
      const newErrors = [];
      const validFiles = [];

      // Check if adding these files would exceed max
      if (images.length + fileArray.length > maxImages) {
        setErrors([
          `Maximum ${maxImages} images allowed. You can only add ${maxImages - images.length} more.`,
        ]);
        return;
      }

      // Validate each file
      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      if (newErrors.length > 0) {
        setErrors(newErrors);
        return;
      }

      // Clear errors
      setErrors([]);

      // Create previews for valid files
      const newImages = [...images];
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageData = {
            file,
            preview: reader.result,
            id: Date.now() + Math.random(), // Unique ID
          };
          newImages.push(imageData);
          setImages([...newImages]);
          onImagesChange([...newImages].map((img) => img.file));
        };
        reader.readAsDataURL(file);
      });
    },
    [images, maxImages, maxSizeBytes, onImagesChange],
  );

  /**
   * Handle file input change
   */
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow re-uploading same file
    e.target.value = "";
  };

  /**
   * Handle drag events
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  /**
   * Remove an image
   */
  const removeImage = (id) => {
    const newImages = images.filter((img) => img.id !== id);
    setImages(newImages);
    onImagesChange(newImages.map((img) => img.file));
    setErrors([]); // Clear errors when removing
  };

  /**
   * Clear all images
   */
  const clearAll = () => {
    setImages([]);
    setErrors([]);
    onImagesChange([]);
  };

  return (
    <div className="image-upload-container">
      <label className="form-label fw-bold mb-3">
        Property Images{" "}
        <span className="text-muted fw-normal">
          (Required: 4 images, max 5MB each)
        </span>
      </label>

      {/* Progress Bar - 4 Segments */}
      <div className="progress-bar-container mb-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`progress-segment ${index < images.length ? "active" : ""} ${
              index === images.length - 1 ? "pulse" : ""
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {index < images.length && <div className="segment-check">✓</div>}
          </div>
        ))}
      </div>

      {/* Upload Complete Message */}
      {images.length === maxImages && (
        <div className="upload-complete-message mb-3">
          <span className="success-icon">✓</span>
          All {maxImages} images uploaded successfully!
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""} ${images.length >= maxImages ? "disabled" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <div className="upload-icon">📷</div>
          <p className="drop-zone-text">
            {images.length >= maxImages
              ? `Maximum ${maxImages} images reached`
              : "Drag & drop images here or click to browse"}
          </p>
          <p className="drop-zone-subtext">
            {images.length < maxImages &&
              `${maxImages - images.length} image${maxImages - images.length !== 1 ? "s" : ""} remaining • JPG, PNG, WebP • Max ${maxSizeMB}MB each`}
          </p>

          {images.length < maxImages && (
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="file-input"
              aria-label="Upload property images"
            required />
          )}
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="error-messages mt-3">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              ⚠️ {error}
            </div>
          ))}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="image-previews mt-4">
          <div className="preview-header">
            <h6 className="mb-0">
              Uploaded Images ({images.length}/{maxImages})
            </h6>
            <button
              type="button"
              onClick={clearAll}
              className="btn btn-sm btn-outline-danger"
            >
              Clear All
            </button>
          </div>
          <div className="preview-grid">
            {images.map((image, index) => (
              <div key={image.id} className="preview-item">
                <img src={image.preview} alt={`Upload ${index + 1}`} />
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="remove-btn"
                  aria-label={`Remove image ${index + 1}`}
                >
                  ✕
                </button>
                <div className="preview-index">{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

ImageUpload.propTypes = {
  onImagesChange: PropTypes.func.isRequired,
  maxImages: PropTypes.number,
  maxSizeMB: PropTypes.number,
};
