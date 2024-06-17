import React, { useRef, useEffect, useState } from 'react';
import './Camera.css';

function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [textShown, setTextShown] = useState(true);
  const [photoPath, setPhotoPath] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null); // State to hold the camera stream

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        setStream(newStream); // Store the new stream in state
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const restartCamera = () => {
    stopCamera();
    startCamera();
  };

  const startCountdown = () => {
    setTextShown(false);
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount === 1) {
          clearInterval(interval);
          if (overlayRef.current) {
            overlayRef.current.classList.add('active');
          }
          setTimeout(() => {
            capturePhoto();
            if (overlayRef.current) {
              overlayRef.current.classList.remove('active');
            }
          }, 1000); // Capture the photo after the screen has turned white
        }
        return prevCount - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCamera(); // Initialize camera on component mount
    return () => {
      stopCamera(); // Clean up: stop camera when component unmounts
    };
  }, []);

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const { videoWidth, videoHeight } = videoRef.current;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

        canvasRef.current.toBlob((blob) => {
          if (blob) {
            setCapturedPhoto(URL.createObjectURL(blob));
            setPhotoBlob(blob);
          } else {
            console.error('Failed to capture image');
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleSave = async () => {
    if (photoBlob) {
      setPhotoPath(await savePhoto()); // Save the photo first and get its path
      setShowEmailForm(true);
    } else {
      console.error('No photo blob to upload');
    }
  };

  const savePhoto = async () => {
    if (photoBlob) {
      const formData = new FormData();
      formData.append('file', photoBlob, 'photo.jpg');

      try {
        const response = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to save photo');
        }

        const result = await response.json();
        return result.path; // Return the path of the saved photo
      } catch (error) {
        console.error('Error saving photo:', error);
        return null;
      }
    } else {
      console.error('No photo blob to save');
      return null;
    }
  };

  const handleSendEmail = async () => {
    if (photoBlob && email) {
      if (photoPath) {
        try {
          const response = await fetch('http://localhost:3001/sendEmail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath: photoPath, email }),
          });

          if (!response.ok) {
            throw new Error('Failed to send email');
          }
          setShowEmailForm(false);
          setCapturedPhoto(null);
          setPhotoBlob(null);
          setEmail('');
        } catch (error) {
          console.error('Error sending email:', error);
        }
      } else {
        console.error('Failed to save photo before sending email');
      }
    } else {
      console.error('No photo blob to send or email not provided');
    }
    handleCancel();
  };

  const handleCancel = () => {
    setCapturedPhoto(null);
    setPhotoBlob(null);
    setTextShown(true);
    setShowEmailForm(false);
    setEmail('');
    restartCamera();
  };

  return (
    <div className="camera-container">
      {!capturedPhoto && (
        <div className="camera-left" onClick={startCountdown}>
          <video ref={videoRef} autoPlay playsInline className="video-stream" />
          {textShown && (
            <div className="overlay-text-left">📸 Touch me to take a picture ! 📸</div>
          )}
          <canvas ref={canvasRef} className="hidden"></canvas>
          <div ref={overlayRef} className="white-overlay"></div>
          {countdown > 0 && (
            <div className="countdown-display">
              {countdown} {/* Display the current countdown */}
            </div>
          )}
        </div>
      )}

      {capturedPhoto && (
        <div className="camera-left">
          {!showEmailForm &&(
            <div>
              <div className="overlay-text-keep">On la garde ?</div>
              <div onClick={handleSave} className="overlay-text-keep-save">✅</div>
              <div onClick={handleCancel} className="overlay-text-keep-cancel">❌</div>
            </div>
          )}
          <img className="captured-image" src={capturedPhoto} alt="Captured" />
        </div>
      )}

      {showEmailForm && (
        <div className="email-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
          />
          <button className="send-button" onClick={handleSendEmail}>
            Envoie la moi !
          </button>
        </div>
      )}

      {/* Nouvelle colonne à droite */}
      <div className="new-column">
        <div>Cadre 1</div>
        <div>Cadre 2</div>
        <div>GIF</div>
      </div>
    </div>
  );
}

export default Camera;