import React, { useRef, useEffect, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
}

type Tab = 'draw' | 'upload';

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [activeTab, setActiveTab] = useState<Tab>('draw');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setActiveTab('draw');
      setUploadedSignature(null);
      return;
    };
    if (activeTab !== 'draw' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const theme = document.documentElement.classList.contains('dark') ? 'dark' 
                : document.documentElement.classList.contains('eye-care') ? 'eye-care' 
                : 'light';

    if (ctx) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.strokeStyle = theme === 'light' ? '#111827' : '#F9FAFB'; // gray-900 or gray-50
        if (theme === 'eye-care') {
            ctx.strokeStyle = '#3c2f24';
        }

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }

    const startDrawing = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        isDrawing.current = true;
        const { offsetX, offsetY } = getCoords(e, canvas);
        ctx?.beginPath();
        ctx?.moveTo(offsetX, offsetY);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const { offsetX, offsetY } = getCoords(e, canvas);
        ctx?.lineTo(offsetX, offsetY);
        ctx?.stroke();
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        ctx?.closePath();
    };
    
    const getCoords = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        if (e instanceof MouseEvent) {
            return { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        }
        if (e.touches[0]) {
             return { offsetX: e.touches[0].clientX - rect.left, offsetY: e.touches[0].clientY - rect.top };
        }
        return { offsetX: 0, offsetY: 0 };
    };


    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isOpen, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedSignature(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (activeTab === 'draw' && canvasRef.current) {
        onSave(canvasRef.current.toDataURL('image/png'));
    } else if (activeTab === 'upload' && uploadedSignature) {
        onSave(uploadedSignature);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-[rgb(var(--color-card))] rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex border-b border-[rgb(var(--color-border))] mb-4">
          <button onClick={() => setActiveTab('draw')} className={`px-4 py-2 font-semibold ${activeTab === 'draw' ? 'border-b-2 border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-secondary))]'}`}>Draw Signature</button>
          <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 font-semibold ${activeTab === 'upload' ? 'border-b-2 border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-secondary))]'}`}>Upload Signature</button>
        </div>

        {activeTab === 'draw' && (
          <canvas ref={canvasRef} className="w-full h-48 border border-[rgb(var(--color-border))] rounded-md bg-[rgb(var(--color-card-secondary))] cursor-crosshair"></canvas>
        )}

        {activeTab === 'upload' && (
          <div className="w-full h-48 border-2 border-dashed border-[rgb(var(--color-border))] rounded-md flex items-center justify-center bg-[rgb(var(--color-card-secondary))]">
            {uploadedSignature ? (
              <img src={uploadedSignature} alt="Signature preview" className="max-h-full max-w-full object-contain" />
            ) : (
              <label htmlFor="sig-upload" className="text-center cursor-pointer text-[rgb(var(--color-text-secondary))]">
                <UploadIcon className="w-10 h-10 mx-auto mb-2 text-[rgb(var(--color-text-tertiary))]" />
                <p className="font-semibold">Click to upload</p>
                <p className="text-sm">PNG or JPG</p>
              </label>
            )}
            <input id="sig-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-4">
          <button onClick={activeTab === 'draw' ? clearCanvas : () => setUploadedSignature(null)} className="px-4 py-2 bg-[rgb(var(--color-card-secondary))] text-[rgb(var(--color-text-primary))] font-semibold rounded-lg hover:bg-[rgb(var(--color-border))] transition-colors">Clear</button>
          <button onClick={handleSave} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-text))] font-semibold rounded-lg hover:bg-[rgb(var(--color-primary-hover))] transition-colors">Save Signature</button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;