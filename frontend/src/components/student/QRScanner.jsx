import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// Props:
// - onScan(result) -> called with parsed JSON object or raw string
// - onClose() -> called when user closes scanner
const QRScanner = ({ onScan, onClose, fps = 10, qrbox = 250 }) => {
  const scannerRef = useRef(null);
  const containerId = useRef(`html5qr-scanner-${Math.random().toString(36).slice(2,9)}`);
  const scannerInstanceRef = useRef(null);
  const isRunningRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)

  useEffect(() => {
    const config = { fps, qrbox };

    async function startScanner() {
      try {
        const html5QrcodeScanner = new Html5Qrcode(containerId.current);
        scannerInstanceRef.current = html5QrcodeScanner;
        
        await html5QrcodeScanner.start(
          { facingMode: facingMode },
          config,
          (decodedText, decodedResult) => {
            // Try to parse JSON, but fallback to raw text
            try {
              const parsed = JSON.parse(decodedText);
              onScan(parsed);
            } catch (e) {
              onScan(decodedText);
            }
          }
        );
        
        isRunningRef.current = true;
      } catch (err) {
        console.error('QR Scanner start failed:', err);
        isRunningRef.current = false;
        setErrorMsg(err.message || 'Camera access denied or not available');
        // Notify parent about error
        setTimeout(() => onScan(null, err), 500);
      }
    }

    startScanner();

    return () => {
      // Only try to stop if scanner is actually running
      if (isRunningRef.current && scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.stop().then(() => {
            try {
              scannerInstanceRef.current.clear();
            } catch (e) {
              console.warn('Error clearing scanner:', e);
            }
          }).catch((err) => {
            console.warn('Error stopping scanner:', err);
          });
        } catch (err) {
          console.warn('Error in cleanup:', err);
        }
      }
      isRunningRef.current = false;
    };
  }, [onScan, fps, qrbox, facingMode]);

  const handleFlipCamera = async () => {
    // Stop current scanner
    if (isRunningRef.current && scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
        scannerInstanceRef.current.clear();
        isRunningRef.current = false;
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    
    // Toggle camera
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg p-4 w-[92%] max-w-2xl">
        {errorMsg ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-semibold">❌ Camera Error</p>
            <p className="text-red-600 text-sm mt-2">{errorMsg}</p>
            <p className="text-red-600 text-sm mt-2">Please allow camera access and try again, or ask your teacher to generate a new QR code.</p>
          </div>
        ) : (
          <div>
            <div id={containerId.current} ref={scannerRef} />
            <p className="text-center text-sm text-gray-600 mt-3">
              Point your camera at the QR code
            </p>
          </div>
        )}
        <div className="mt-3 flex justify-between gap-2">
          <button 
            onClick={handleFlipCamera} 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            disabled={!!errorMsg}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Flip Camera
          </button>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
