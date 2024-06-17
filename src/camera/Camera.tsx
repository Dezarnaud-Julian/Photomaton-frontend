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
    async function getCameraStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
      }
    }

    getCameraStream();
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
  };

  const handleCancel = () => {
    setCapturedPhoto(null);
    setPhotoBlob(null);
    setShowEmailForm(false);
    setEmail('');
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
          <div className="overlay-text-left">On la garde ?</div>
          {/* <div className="save-button">On la garde !</div> */}
          {/*<div className="cancel-button" onClick={handleCancel}>Nan elle est moche</div> */}
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
    </div>
  );
}

export default Camera;