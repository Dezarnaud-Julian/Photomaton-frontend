import React, { useRef, useEffect, useState } from 'react';
import './Camera.css';
import gifshot from 'gifshot';
import crowd from '../cadres/crowd.png';
import dreamlike from '../cadres/dreamlike.png';
import cadre_or from '../cadres/or.png';
import VS from '../cadres/VS.png';
import HappyBirthday from '../cadres/HappyBirthday.png';
import HappyBirthday2 from '../cadres/HappyBirthday2.png';
import Moustaches from '../cadres/Moustaches.png';

import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

const backendAdress = process.env.REACT_APP_BACKEND_ADRESS ?? 'http://127.0.0.1:3001'
function Camera() {
  // État pour le texte de chargement
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cadre, setCadre] = useState<number>(0);
  const [cadres, setCadres] = useState<string[]>([]);
  const [mode, setMode] = useState<string>("PICTURE");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [showSavingOptions, setShowSavingOptions] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [textShown, setTextShown] = useState(true);
  const [photoPath, setPhotoPath] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [printCopies, setPrintCopies] = useState(1);
  const [gifFinished, setGifFinished] = useState(true);
  const [showMenu, setShowMenu] = useState(true);
  const [enteringEmail, setEnteringEmail] = useState(false);

  let videoConstraints = {
    video: {
      width: { ideal: 1614, min: 1614, max: 1614 },
      height: { ideal: 1080, min: 0, max: 1080 },
      facingMode: 'user',
    },
  };
  
  const startCamera = async () => {
    setCadres(["Aucun cadre", cadre_or, HappyBirthday, HappyBirthday2, VS, Moustaches]);
    setCadre(0);
    try {
      /*const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = initialStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      videoTrack.stop();
  
      if (capabilities.width && capabilities.height && capabilities.width.max && capabilities.height.max) {
        const maxHeight = capabilities.height.max;
        const maxWidth = maxHeight * (videoConstraints.video.width.ideal/videoConstraints.video.height.ideal);
  
        videoConstraints = {
          video: {
            width: { ideal: maxWidth, min: maxWidth, max: maxWidth },
            height: { ideal: maxHeight, min: maxHeight, max: maxHeight },
            facingMode: 'user',
          },
        };
      }*/
  
      const newStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        setStream(newStream);
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

  const startCountdown = async (secondes: number) => {
    setTextShown(false);
    setCountdown(secondes);
  
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount === 1) {
            clearInterval(interval);
            if (overlayRef.current) {
              overlayRef.current.classList.add('active');
            }
            setTimeout(() => {
              if (overlayRef.current) {
                overlayRef.current.classList.remove('active');
              }
              resolve();
            }, 1000);
          }
          return prevCount - 1;
        });
      }, 1000);
    });
  };

  const captureMedia = async () => {
    setShowMenu(false);
    await capture();
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const capture = async () => {
    if (mode === "PICTURE") {
      await startCountdown(4);
      capturePhoto();
    } else if (mode === "GIF") {
      setGifFinished(false);
      let photosForGif: string[] = [];
      for (let i = 0; i < 4; i++) {
        await startCountdown(3);
        const photoGif = await capturePhoto() as string;
        photosForGif.push(photoGif);
      }
      setGifFinished(true);
      createGif(photosForGif);
    }
  };

  const createGif = async (photos: string[]) => {
    const gifWidth = 1614;
    const gifHeight = 1080;

    gifshot.createGIF({
      images: photos,
      interval: 0.5,
      gifWidth: gifWidth,
      gifHeight: gifHeight,
    }, function (obj: { error: any; image: any; errorMsg: any; }) {
      if (!obj.error) {
        const image = obj.image;
        setCapturedPhoto(image);
        const blob = dataURLToBlob(image);
        setPhotoBlob(blob);
      } else {
        console.error('Failed to create GIF:', obj.errorMsg);
      }
    });
  };

  function dataURLToBlob(dataURL: string) {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  const capturePhoto = async () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const { videoWidth, videoHeight } = videoRef.current;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        context.save();

        context.translate(videoWidth, 0);
        context.scale(-1, 1);

        context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

        context.restore();

        if (cadre !== 0) {
          const cadreImage = new Image();
          cadreImage.src = cadres[cadre];

          return new Promise((resolve, reject) => {
            cadreImage.onload = () => {
              context.drawImage(cadreImage, 0, 0, videoWidth, videoHeight);
              canvasRef.current!.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  setCapturedPhoto(url);
                  setPhotoBlob(blob);
                  resolve(url);
                } else {
                  console.error('Failed to capture image');
                  reject(new Error('Failed to capture image'));
                }
              }, 'image/jpeg');
            };

            cadreImage.onerror = () => {
              console.error('Failed to load the frame image');
              reject(new Error('Failed to load the frame image'));
            };
          });
        } else {
          return new Promise((resolve, reject) => {
            if (canvasRef.current) {
              canvasRef.current.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  setCapturedPhoto(url);
                  setPhotoBlob(blob);
                  resolve(url);
                } else {
                  console.error('Failed to capture image');
                  reject(new Error('Failed to capture image'));
                }
              }, 'image/jpeg', 1.0);
            } else {
              reject(new Error('Canvas element not found'));
            }
          });
        }
      }
    } else {
      return Promise.reject(new Error('Canvas or video element not found'));
    }
  };  

  const handleSave = async () => {
    if (photoBlob) {
      setPhotoPath(await savePhoto());
      setShowSavingOptions(true);
    } else {
      console.error('No photo blob to upload');
    }
  };

  const savePhoto = async () => {
    if (photoBlob) {
      const formData = new FormData();
      if (mode === "PICTURE") {
        formData.append('file', photoBlob, 'photo.jpg');
        formData.append('mode', '.jpg');
      } else if (mode === "GIF") {
        formData.append('file', photoBlob, 'photo.gif');
        formData.append('mode', '.gif');
      }

      try {
        const response = await fetch(`${backendAdress}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to save photo');
        }

        const result = await response.json();
        return result.path;
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
    setEnteringEmail(false)
    if (photoBlob && email) {
      if (photoPath) {
        setLoading(true);
        try {
          const response = await fetch(`${backendAdress}/sendEmail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath: photoPath, email }),
          });

          if (!response.ok) {
            throw new Error('Failed to send email');
          }
        } catch (error) {
          console.error('Error sending email:', error);
        } finally {
          setLoading(false);
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
    setTextShown(true);
    setShowSavingOptions(false);
    setEmail('');
    setShowMenu(true);
    setEnteringEmail(false);
  };

  const switchMode = (mode: string) => {
    setMode(mode);
  };

  const handlePrint = async () => {
    if (photoBlob) {
      if (photoPath) {
        setLoading(true);
        try {
          const response = await fetch(`${backendAdress}/print`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath: photoPath, copies: printCopies }),
          });

          if (!response.ok) {
            throw new Error('Failed to print photo');
          }
          console.log('Photo sent for printing');
        } catch (error) {
          console.error('Error printing photo:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.error('Failed to save photo before printing');
      }
    } else {
      console.error('No photo blob to print');
    }
  };

  const onKeyboardChange = (input:string) => {
    console.log("Input changed", input);
    setEmail(input)
  }

  const onKeyPress = (button:string) => {
    console.log("Button pressed", button);
    if(button==="{enter}") setEnteringEmail(false)
  }

  const putCadre = async (cadreToPut : number) => {
    if(cadreToPut === -5){
      if(cadre === 0){
        setCadre(1);
      }else{
        setCadre(0);
      }
    }else{
      if(cadre === cadreToPut){
        setCadre(0);
      }else{
        setCadre(cadreToPut);
      }
      if(cadreToPut < 0){setCadre(cadres.length-1);}
      else if(cadreToPut >= cadres.length){setCadre(0);}
    }
  };

  const putCopies = async (copies : number) => {
      if(copies < 0){setPrintCopies(0)}
      else if(copies > 6){setPrintCopies(6)}
      else {setPrintCopies(copies)}
  };

  function extractTextFromPath(path:string) {
    if(path === "Frame : None" || path === undefined){
      return "Frame : None";
    }
    const startIndex = path.indexOf("/static/media/") + "/static/media/".length;
    const endIndex = path.indexOf(".", startIndex);
    const extractedText = path.substring(startIndex, endIndex);
    return extractedText;
  }

  return (
    <div className="camera-container">
      <div className="camera-left" onClick={textShown ? captureMedia : undefined}>
        <video ref={videoRef} autoPlay playsInline className="video-stream" />
        {cadre !== 0 && (<div className='captured-image-cadre-container'><img className="captured-image-cadre" style={{aspectRatio: videoRef.current?.videoWidth!+"/"+videoRef.current?.videoHeight!}} src={cadres[cadre]} alt="Captured" /></div>)}
  
        {textShown && (
          <div className="overlay-text-left">
            <p style={{margin: 0, textWrap: "nowrap"}}>Appuies pour prendre une photo</p>
            <p style={{margin: 0}} className='photo-anim'></p>
            <p style={{fontSize: "15vh", margin: 0, height: 0}} className='touch-anim'>👆</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden"></canvas>
        <div ref={overlayRef} className="white-overlay"></div>
        {countdown > 0 && (
          <div className="countdown-display">
            {countdown+1}
          </div>
        )}
      </div>
  
      {capturedPhoto && (
        <div className={gifFinished ? "camera-left" : "camera-left-picture"}>
          {!showSavingOptions && gifFinished && (
            <div>
              <div className="overlay-text-keep">On la garde ?</div>
              <div onClick={handleSave} className="overlay-text-keep-save">✅</div>
              <div onClick={handleCancel} className="overlay-text-keep-cancel">❌</div>
            </div>
          )}
          <img className="captured-image" src={capturedPhoto} alt="Captured" />
        </div>
      )}
  
      {showSavingOptions && (
        <div className="form-buttons">
          <div style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center"
          }}>
            <input
              className={`${mode === 'PICTURE' ? 'email-input-short' : 'email-input-long'}`}
              type="email"
              value={email}
              onFocus={() => setEnteringEmail(true)}
              // onBlur={() => setEnteringEmail(false)}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entres ton adresse email"
            />
          
            <div className={`form-button active`} onClick={handleSendEmail}>ENVOYER</div>

            {mode === 'PICTURE' && (
              <div className="form-impr">
                <div onClick={() => putCopies(printCopies - 1)} className="form-button navigation">&lt;</div>
                <div onClick={() => putCopies(0)} className="form-button copies">
                  {"Copies:"+printCopies.toString()}
                </div>
                <div onClick={() => putCopies(printCopies + 1)} className="form-button navigation">&gt;</div>
                <div className={`form-button ${printCopies !== 0 ? 'active' : 'inactive'}`} onClick={handlePrint}>IMPRIMER</div>
              </div>
            )} 
          
            <div className={`form-button red`} onClick={handleCancel}>ANNULER</div>
          </div>
          {enteringEmail && <div style={{ width: "100%"}}>
            <Keyboard
              onChange={onKeyboardChange}
              onKeyPress={onKeyPress}
            />
          </div>}     
        </div>      
      )}
  
      {!showSavingOptions && showMenu && (
        <div className="camera-buttons">
          <div className={`camera-button ${mode === 'PICTURE' ? 'active' : 'inactive'}`} onClick={() => switchMode("PICTURE")}>IMAGE</div>
          <div className={`camera-button right ${mode === 'GIF' ? 'active' : 'inactive'}`} onClick={() => switchMode("GIF")}>IMAGE ANIMÉE</div>

          <div className="camera-button navigation" onClick={() => putCadre(cadre - 1)}>&lt;</div>
          <div className={`camera-button ${extractTextFromPath(cadres[cadre]) !== "Aucun cadre" ? 'active' : 'inactive'}`} onClick={() => putCadre(-5)}>
            {extractTextFromPath(cadres[cadre])}
          </div>
          <div className="camera-button navigation" onClick={() => putCadre(cadre + 1)}>&gt;</div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-text">Patientez</div>
          <div className="spinner"></div>
        </div>
      )}

    </div>
  );
}

export default Camera;