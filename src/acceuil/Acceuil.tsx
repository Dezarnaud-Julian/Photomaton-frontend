import React, { useRef, useEffect } from 'react';
import './Acceuil.css';
import { useNavigate } from 'react-router-dom';

function Acceuil() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

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

  const handleClick = () => {
    navigate('/menu');
  };

  return (
    <div className="camera" onClick={handleClick}>
      <video ref={videoRef} autoPlay playsInline className="video-stream" />
      <div className="overlay-text">📸 Touch me to take a picture ! 📸</div>
    </div>
  );
}

export default Acceuil;
