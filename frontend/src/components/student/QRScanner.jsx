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
  const [errorType, setErrorType] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [isSecureContext, setIsSecureContext] = useState(true);

  useEffect(() => {
    // Check if running in secure context (HTTPS or localhost)
    const isSecure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsSecureContext(isSecure);
    
    if (!isSecure) {
      setErrorMsg('Camera access requires HTTPS connection');
      setErrorType('https');
      setTimeout(() => onScan(null, new Error('HTTPS required')), 500);
      return;
    }

    const config = { fps, qrbox };

    async function startScanner() {
      try {
        // Check if camera is available
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        
        if (!hasCamera) {
          throw new Error('No camera found on this device');
        }

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
        
        // Determine error type
        if (err.name === 'NotAllowedError' || err.message.includes('Permission')) {
          setErrorType('permission');
          setErrorMsg('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.message.includes('camera')) {
          setErrorType('camera');
          setErrorMsg('No camera found or camera is being used by another app.');
        } else {
          setErrorType('unknown');
          setErrorMsg(err.message || 'Camera access failed');
        }
        
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
    if (errorMsg) return; // Don't flip if there's an error
    
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

  const getErrorSolution = () => {
    switch (errorType) {
      case 'https':
        return (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p className="font-semibold text-yellow-800">🔒 Solution:</p>
            <p className="text-yellow-700 mt-1">Camera access requires a secure HTTPS connection. Please make sure you're accessing the site via HTTPS.</p>
          </div>
        );
      case 'permission':
        return (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-semibold text-blue-800">📱 Solution:</p>
            <ul className="text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Click the camera icon in your browser's address bar</li>
              <li>Select "Allow" for camera access</li>
              <li>Refresh the page and try again</li>
              <li>On mobile: Check Settings → Safari/Chrome → Camera permissions</li>
            </ul>
          </div>
        );
      case 'camera':
        return (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
            <p className="font-semibold text-purple-800">📷 Solution:</p>
            <ul className="text-purple-700 mt-2 space-y-1 list-disc list-inside">
              <li>Close other apps using the camera</li>
              <li>Try restarting your browser</li>
              <li>Make sure no other tab is using the camera</li>
            </ul>
          </div>
        );
      default:
        return (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <p className="font-semibold text-gray-800">💡 Try:</p>
            <ul className="text-gray-700 mt-2 space-y-1 list-disc list-inside">
              <li>Refresh the page</li>
              <li>Allow camera permissions</li>
              <li>Try a different browser</li>
            </ul>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {errorMsg ? (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold text-lg">❌ Camera Error</p>
              <p className="text-red-600 mt-2">{errorMsg}</p>
            </div>
            {getErrorSolution()}
          </div>
        ) : (
          <div>
            <div id={containerId.current} ref={scannerRef} className="rounded-lg overflow-hidden" />
            <p className="text-center text-sm text-gray-600 mt-3 font-medium">
              📱 Point your camera at the QR code
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
