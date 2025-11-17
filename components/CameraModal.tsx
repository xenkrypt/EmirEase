import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Import CameraIcon component.
import { CameraIcon } from './icons/CameraIcon';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setIsStarting(true);
    setError(null);
    setCapturedImage(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check permissions and try again.");
      } finally {
        setIsStarting(false);
      }
    } else {
        setError("Your browser does not support camera access.");
        setIsStarting(false);
    }
  }, [stopCamera]);


  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleConfirm = () => {
    if (capturedImage && canvasRef.current) {
        canvasRef.current.toBlob(blob => {
            if(blob) {
                const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                onCapture(file);
            }
        }, 'image/jpeg');
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-[rgb(var(--color-card))] rounded-lg shadow-xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4 text-[rgb(var(--color-text-primary))]">Capture Document</h3>
        <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
            {error && <div className="text-center text-red-400 p-4">{error}</div>}
            
            {isStarting && !error && <div className="text-white">Starting camera...</div>}
            
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-contain transition-opacity duration-300 ${capturedImage || isStarting || error ? 'opacity-0' : 'opacity-100'}`}
            ></video>

            {capturedImage && (
                <img src={capturedImage} alt="Captured preview" className="absolute inset-0 w-full h-full object-contain" />
            )}

            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <div className="flex justify-center space-x-4 mt-4">
          {capturedImage ? (
            <>
                <button onClick={startCamera} className="px-4 py-2 bg-[rgb(var(--color-card-secondary))] text-[rgb(var(--color-text-primary))] font-semibold rounded-lg hover:bg-[rgb(var(--color-border))] transition-colors">Retake</button>
                <button onClick={handleConfirm} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-text))] font-semibold rounded-lg hover:bg-[rgb(var(--color-primary-hover))] transition-colors">Confirm & Analyze</button>
            </>
          ) : (
            <button onClick={handleCapture} disabled={!!error || isStarting} className="p-4 bg-[rgb(var(--color-primary))] text-white rounded-full hover:bg-[rgb(var(--color-primary-hover))] transition-colors disabled:opacity-50">
                <CameraIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;