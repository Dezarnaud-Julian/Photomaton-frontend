import React, { useRef, useEffect, useState } from 'react';
import './Camera.css';
import gifshot from 'gifshot';
import foule from '../cadres/foule.png';
import onirique from '../cadres/onirique.png';


function Camera() {
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
  const [stream, setStream] = useState<MediaStream | null>(null); // State to hold the camera stream
  const [printCopies, setPrintCopies] = useState(1); // State to hold the number of print copies
  const [gifFinished, setGifFinished] = useState(true);
  const [showMenu, setShowMenu] = useState(true);

  

  const startCamera = async () => {
    setCadres(["Aucun",onirique,foule]);
    setCadre(0);
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
              resolve();  // Resolve the promise after the overlay is hidden
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
    startCamera(); // Initialize camera on component mount
    return () => {
      stopCamera(); // Clean up: stop camera when component unmounts
    };
  }, []);

  const capture = async () => {
    if (mode === "PICTURE") {
      await startCountdown(3);
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
    const gifWidth = 1600; // Largeur souhaitée du GIF
    const gifHeight = 1200; // Hauteur souhaitée du GIF

    gifshot.createGIF({
      images: photos,
      interval: 0.5,
      gifWidth: gifWidth,
      gifHeight: gifHeight,
    }, function (obj: { error: any; image: any; errorMsg: any; }) {
      if (!obj.error) {
        const image = obj.image; // Data URL
        setCapturedPhoto(image); // Set the generated GIF as the captured photo
        const blob = dataURLToBlob(image);
        setPhotoBlob(blob);
      } else {
        console.error('Failed to create GIF:', obj.errorMsg);
      }
    });
  };

  // Utility function to convert data URL to Blob
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
        context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
  
        // Dessiner le cadre par-dessus l'image capturée
        if (cadre !== 0) {
          const cadreImage = new Image();
          cadreImage.src = cadres[cadre];
  
          return new Promise((resolve, reject) => {
            const bottomPosition = videoHeight - videoHeight / 2;
            cadreImage.onload = () => {
              context.drawImage(cadreImage, 0, bottomPosition, videoWidth, videoHeight / 2);              canvasRef.current!.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  setCapturedPhoto(url);
                  setPhotoBlob(blob);
                  resolve(url); // Résoudre la promesse avec l'URL
                } else {
                  console.error('Failed to capture image');
                  reject(new Error('Failed to capture image')); // Rejeter la promesse en cas d'échec
                }
              }, 'image/jpeg');
            };
  
            cadreImage.onerror = () => {
              console.error('Failed to load the frame image');
              reject(new Error('Failed to load the frame image'));
            };
          });
        } else {
          // Si aucun cadre n'est défini, convertir directement le canvas en Blob et en URL
          return new Promise((resolve, reject) => {
            if (canvasRef.current) {
              canvasRef.current.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  setCapturedPhoto(url);
                  setPhotoBlob(blob);
                  resolve(url); // Résoudre la promesse avec l'URL
                } else {
                  console.error('Failed to capture image');
                  reject(new Error('Failed to capture image')); // Rejeter la promesse en cas d'échec
                }
              }, 'image/jpeg');
            } else {
              reject(new Error('Canvas element not found')); // Rejeter si l'élément canvas est introuvable
            }
          });
        }
      }
    } else {
      return Promise.reject(new Error('Canvas or video element not found')); // Rejeter si le canvas ou la vidéo est introuvable
    }
  };  

  const handleSave = async () => {
    if (photoBlob) {
      setPhotoPath(await savePhoto()); // Save the photo first and get its path
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
    setTextShown(true);
    setShowSavingOptions(false);
    setEmail('');
    setShowMenu(true);
    restartCamera();
  };

  const switchMode = (mode: string) => {
    setMode(mode);
  };

  const handlePrint = async () => {
    if (photoBlob) {
      if (photoPath) {
        try {
          const response = await fetch('http://localhost:3001/print', {
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
        }
      } else {
        console.error('Failed to save photo before printing');
      }
    } else {
      console.error('No photo blob to print');
    }
  };

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
      console.log(copies);
      if(copies < 0){setPrintCopies(0)}
      else if(copies > 6){setPrintCopies(6)}
      else {setPrintCopies(copies)}
  };

  function extractTextFromPath(path:string) {
    if(path === "Aucun" || path === undefined){
      return "Aucun";
    }
    // Trouver la position du texte "/static/media/"
    const startIndex = path.indexOf("/static/media/") + "/static/media/".length;
    
    // Trouver la position du caractère "."
    const endIndex = path.indexOf(".", startIndex);
    
    // Extraire le texte entre startIndex et endIndex
    const extractedText = path.substring(startIndex, endIndex);
    
    return extractedText;
  }

  return (
    <div className="camera-container">
      <div className="camera-left" onClick={captureMedia}>
        <video ref={videoRef} autoPlay playsInline className="video-stream" />
        {cadre!==0 && (<img className="captured-image-cadre" src={cadres[cadre]} alt="Captured" />)}

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
        <div className="porte-column">
          <div className="new-column">
            <div className="email-form">
              <input
                className="send-text"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className={`new-columnParts-imprimer`}  onClick={handleSendEmail}>ENVOYER</div>


            <div className="new-columnParts-imprimerLA">Imprime là!</div>
            <div className="print-form">
              <div className={`inner-div-copies ${printCopies !==0 ? 'active' : ''}`} >
                  <div onClick={() => putCopies(printCopies-1)}className="inner-div-arrow">&lt;</div>
                    <div onClick={() => putCopies(0)} className="center">
                      Copies : {printCopies}
                    </div>
                  <div onClick={() => putCopies(printCopies+1)} className="inner-div-arrow">&gt;</div>
              </div>
              <div className={`new-columnParts-imprimer`}  onClick={handlePrint}>IMPRIMER</div>
            </div>
            <div>
              <div className={`new-columnParts-retour`}  onClick={handleCancel}>RETOUR</div>
            </div>
          </div>
        </div>
      )}

      {!showSavingOptions && showMenu &&(
        <div className="porte-column">
          <div className="new-column">
            <div>
              <div className={`new-columnParts ${mode === 'PICTURE' ? 'active' : ''}`}  onClick={() => switchMode("PICTURE")}>PICTURE</div>
            </div>
            <div>
              <div className={`new-columnParts ${mode === 'GIF' ? 'active' : ''}`} onClick={() => switchMode("GIF")}>GIF</div>
            </div>
              <div className={`inner-div ${extractTextFromPath(cadres[cadre])!=="Aucun" ? 'active' : ''}`} >
                <div onClick={() => putCadre(cadre-1)}className="inner-div-arrow">&lt;</div>
                <div onClick={() => putCadre(-5)} className="center">
                  Cadre :<br />
                  {extractTextFromPath(cadres[cadre])}
                </div>
                <div onClick={() => putCadre(cadre+1)} className="inner-div-arrow">&gt;</div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Camera;