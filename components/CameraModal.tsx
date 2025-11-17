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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    setCapturedImage(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check permissions and try again.");
      }
    } else {
        setError("Your browser does not support camera access.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

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
    if (videoRef.current && canvasRef.current) {
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

  const handleRetake = () => {
    startCamera();
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
        <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
            {error && <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4">{error}</div>}
            
            {capturedImage ? (
                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
            ) : (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain"></video>
            )}

            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <div className="flex justify-center space-x-4 mt-4">
          {capturedImage ? (
            <>
                <button onClick={handleRetake} className="px-4 py-2 bg-[rgb(var(--color-card-secondary))] text-[rgb(var(--color-text-primary))] font-semibold rounded-lg hover:bg-[rgb(var(--color-border))] transition-colors">Retake</button>
                <button onClick={handleConfirm} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-text))] font-semibold rounded-lg hover:bg-[rgb(var(--color-primary-hover))] transition-colors">Confirm & Analyze</button>
            </>
          ) : (
            <button onClick={handleCapture} disabled={!!error} className="p-4 bg-[rgb(var(--color-primary))] text-white rounded-full hover:bg-[rgb(var(--color-primary-hover))] transition-colors disabled:opacity-50">
                <CameraIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;