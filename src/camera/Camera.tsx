import React, { useRef, useEffect, useState } from 'react';
import './Camera.css';

function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');

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

  const handleSave = () => {
    if (photoBlob) {
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
      const photoPath = await savePhoto(); // Save the photo first and get its path
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
      <div className={`camera-view ${capturedPhoto ? 'hidden' : ''}`}>
        <video ref={videoRef} autoPlay playsInline className="video-stream" />
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        <button className="capture-button" onClick={capturePhoto}>
          Capture
        </button>
      </div>
      {capturedPhoto && (
        <div className="captured-photo">
          <img src={capturedPhoto} alt="Captured" />
          <div className="buttons">
            {!showEmailForm && (
              <button className="save-button" onClick={handleSave}>
                Ont la garde !
              </button>
            )}
            <button className="cancel-button" onClick={handleCancel}>
              Nan elle est moche
            </button>
          </div>
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