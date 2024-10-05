import React, { useRef, useEffect, useState } from 'react';
import './Camera.css';
import gifshot from 'gifshot';
import POLAROIDBASE from '../cadres/POLAROIDBASE.png';
import Settings from '../settings/Settings';

import cadre_or from '../filtres/paysage/or.png';
import VS from '../filtres/paysage/VS.png';
import HappyBirthday from '../filtres/paysage/HappyBirthday.png';
import HappyBirthday2 from '../filtres/paysage/HappyBirthday2.png';
import Moustaches from '../filtres/paysage/Moustaches.png';
import MatousBAS from '../cadres/polaroid/MATOUS.png';
import CadreTest from '../cadres/polaroid/CADRE.png';
import Matous from '../filtres/polaroid/matous.png';
import OctoberRose1 from "../filtres/paysage/rose1.png"
import OctoberRose2 from "../filtres/paysage/rose2.png"
import JessEtSeb from "../filtres/paysage/jess&seb.png"

const debugConfig = {
  canPrint: true,
  templates: ["PAYSAGE", "POLAROID", "MINIPOLAROID"],
  cameraModes: ["PICTURE", "GIF"],
  cadres: {
    polaroid: [MatousBAS],
    paysage: []
  },
  filtres: {
    polaroid: [],
    paysage: [OctoberRose1, Moustaches],
    defaultPaysageFilter: 1
  }
}
const octobreRoseConfig = {
  canPrint: false,
  templates: ["PAYSAGE"],
  cameraModes: ["PICTURE", "GIF"],
  cadres: {
    polaroid: [MatousBAS],
    paysage: []
  },
  filtres: {
    polaroid: [],
    paysage: ["Aucun filtre", OctoberRose1, OctoberRose2],
    defaultPaysageFilter: 1
  }
}
const mariageConfig = {
  canPrint: true,
  templates: ["PAYSAGE"],
  cameraModes: ["PICTURE"],
  cadres: {
    polaroid: [],
    paysage: []
  },
  filtres: {
    polaroid: [],
    paysage: ["Aucun filtre", JessEtSeb, Moustaches],
    defaultPaysageFilter: 1
  }
}
const config = mariageConfig;
const backendAdress = process.env.REACT_APP_BACKEND_ADRESS ?? 'http://127.0.0.1:3001'
function Camera() {
  // État pour le texte de chargement
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<number>(config.filtres.defaultPaysageFilter);
  const [cadrePOLA, setCadre] = useState<number>(0);

  const [filtresPAYSAGE, setFiltresPAYSAGE] = useState<string[]>(config.filtres.paysage);
  const [filtresPOLAROID, setFiltresPOLAROID] = useState<string[]>(config.filtres.polaroid);
  const [filtresMINIPOLAROID, setFiltresMINIPOLAROID] = useState<string[]>(["Aucun filtre"]);
  const [cadresPOLAROID, setCadresPOLAROID] = useState<string[]>(config.cadres.polaroid);
  const [modes, setModes] = useState<string[]>(config.cameraModes);
  const [mode, setMode] = useState<string>(config.cameraModes[0]);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [showSavingOptions, setShowSavingOptions] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [textShown, setTextShown] = useState(true);
  const [photoPath, setPhotoPath] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [printCopies, setPrintCopies] = useState(1);
  const [printError, setPrintError] = useState<string | null>(null);
  const [gifFinished, setGifFinished] = useState(true);
  const [showMenu, setShowMenu] = useState(true);
  const [enteringEmail, setEnteringEmail] = useState(false);
  const [templates, setTemplates] = useState<string[]>(config.templates);
  const [template, setTemplate] = useState(config.templates[0]);

  let videoConstraintsStart = {
    video: {
      width: 500,
      height: 500,
      facingMode: 'user',
    },
  };
  let videoConstraintsFull = {
    video: {
      width: 3228,
      height: 2160,
      facingMode: 'user',
    },
  };

  const startCamera = async () => {
    try {
      console.log("START CAMERA")
      let basicStream = await navigator.mediaDevices.getUserMedia(videoConstraintsStart);
      if (videoRef.current) {
        videoRef.current.srcObject = basicStream;
        setStream(basicStream);
      }
      const videoTrack = basicStream.getVideoTracks()[0];
      videoTrack.stop();

      let newStream = await navigator.mediaDevices.getUserMedia(videoConstraintsFull);

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

  const restartCamera = async (template: string) => {
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
            if (overlayRef.current) overlayRef.current.classList.add('active');
            setTimeout(() => {
              if (overlayRef.current) overlayRef.current.classList.remove('active');
              resolve();
            }, 500);
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
    let gifWidth = 1614;
    let gifHeight = 1080;

    if (template === "POLAROID") {
      gifWidth = 2160;
      gifHeight = 2160;
    }

    if (template === "MINIPOLAROID") {
      gifWidth = 1400;
      gifHeight = 2160;
    }
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

        let canvasWidth = videoWidth;
        let canvasHeight = videoHeight;
        if (template === "POLAROID") {
          canvasWidth = 2160;
          canvasHeight = 2160;
        } else if (template === "MINIPOLAROID") {
          canvasWidth = 1400;
          canvasHeight = 2160;
        } else if (template === "PAYSAGE") {
          canvasWidth = 3228;
          canvasHeight = 2160;
        }

        canvasRef.current.width = canvasWidth;
        canvasRef.current.height = canvasHeight;

        context.save();

        // Calculate the scale to maintain aspect ratio
        const scale = Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight);
        const drawWidth = videoWidth * scale;
        const drawHeight = videoHeight * scale;

        // Calculate the offsets to center the video
        const offsetX = (canvasWidth - drawWidth) / 2;
        const offsetY = (canvasHeight - drawHeight) / 2;

        // Draw the video on the canvas, cropping as needed
        context.drawImage(videoRef.current, offsetX, offsetY, drawWidth, drawHeight);

        context.restore();

        // Gestion des cadres
        if (filter !== 0) {
          const cadreImage = new Image();

          // Sélection de l'image du cadre en fonction du template
          if (template === "POLAROID") {
            cadreImage.src = filtresPOLAROID[filter];
          } else if (template === "MINIPOLAROID") {
            cadreImage.src = filtresMINIPOLAROID[filter];
          } else {
            cadreImage.src = filtresPAYSAGE[filter];
          }

          return new Promise((resolve, reject) => {
            cadreImage.onload = () => {
              // Vérification de canvasRef.current avant d'utiliser ses méthodes
              if (canvasRef.current) {
                // Dessiner le cadre par-dessus l'image capturée
                context.drawImage(cadreImage, 0, 0, canvasRef.current.width, canvasRef.current.height);
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
                }, 'image/jpeg');
              } else {
                reject(new Error('Canvas reference is null'));
              }
            };

            cadreImage.onerror = () => {
              console.error('Failed to load the frame image');
              reject(new Error('Failed to load the frame image'));
            };
          });
        } else {
          // Sans cadre
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
              reject(new Error('Canvas reference is null'));
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
      console.log("PHOTO PATH", photoPath)
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

  const switchMode = (number: number) => {
    console.log("Switching mode");
    const searchTerm = mode;
    let index = modes.findIndex((mode) => mode === searchTerm);

    index = index + number
    if (index === modes.length) {
      setMode(modes[0]);
    } else {
      if (index === -1) {
        setMode(modes[modes.length - 1]);
      } else {
        setMode(modes[index]);
      }
    }
  };

  const switchTemplate = (number: number) => {
    console.log("Switching template");
    const searchTerm = template;
    let index = templates.findIndex((template) => template === searchTerm);

    index = index + number
    if (index === templates.length) {
      setTemplate(templates[0]);
    } else {
      if (index === -1) {
        setTemplate(templates[templates.length - 1]);
      } else {
        setTemplate(templates[index]);
      }
    }
  };

  const handlePrint = async () => {
    if (photoBlob) {
      if (photoPath) {
        setLoading(true);
        setPrintError(null); // Réinitialiser l'erreur avant chaque impression
        try {
          const cadreValue = cadrePOLA === 0
            ? "NULL"
            : cadresPOLAROID[cadrePOLA].split('/')[3].split('.')[0];

          console.log(cadreValue)
          const response = await fetch(`${backendAdress}/print`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filePath: photoPath,
              copies: printCopies,
              template: template,
              cadre: cadreValue // Utilisation de la valeur de cadre
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null); // En cas d'erreur de parsing JSON
            const errorMessage = errorData && errorData.message ? errorData.message : `Erreur lors de l'impression: ${response.statusText}`;
            throw new Error(errorMessage);
          }

          console.log('Photo sent for printing');
        } catch (error: any) {
          setPrintError(error.message);
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

  const onKeyboardChange = (input: string) => {
    console.log("Input changed", input);
    setEmail(input)
  }

  const onKeyPress = (button: string) => {
    console.log("Button pressed", button);
    if (button === "{enter}") setEnteringEmail(false)
  }

  const putFilter = async (filterIndex: number) => {
    if (filterIndex === -5) {
      if (filter === 0) {
        setFilter(1);
      } else {
        setFilter(0);
      }
    } else {
      if (filter === filterIndex) {
        setFilter(0);
      } else {
        setFilter(filterIndex);
      }
      if (template === "POLAROID") {
        if (filterIndex < 0) { setFilter(filtresPOLAROID.length - 1); }
        else if (filterIndex >= filtresPOLAROID.length) { setFilter(0); }
      } else {
        if (template === "MINIPOLAROID") {
          if (filterIndex < 0) { setFilter(filtresMINIPOLAROID.length - 1); }
          else if (filterIndex >= filtresMINIPOLAROID.length) { setFilter(0); }
        } else {
          if (filterIndex < 0) { setFilter(filtresPAYSAGE.length - 1); }
          else if (filterIndex >= filtresPAYSAGE.length) { setFilter(0); }
        }
      }
    }
  };

  const switchCadre = async (cadreIndex: number) => {
    console.log(cadreIndex);
    let newIndex = cadreIndex;
    if (newIndex < 0) {
      newIndex = cadresPOLAROID.length - 1;
    } else if (cadreIndex >= cadresPOLAROID.length) {
      newIndex = 0;
    }
    if (template === "POLAROID") setCadre(newIndex);
  };

  const putCopies = async (copies: number) => {
    if (copies < 1) { setPrintCopies(1) }
    else if (copies > 6) { setPrintCopies(6) }
    else { setPrintCopies(copies) }
  };

  function extractTextFromPath(path: string) {
    if (path === "Frame : None" || path === undefined) {
      return "Frame : None";
    }
    const startIndex = path.indexOf("/static/media/") + "/static/media/".length;
    const endIndex = path.indexOf(".", startIndex);
    const extractedText = path.substring(startIndex, endIndex);
    return extractedText;
  }

  const handleCopiesUpdated = (newCopies: string) => {
    setPrintError(null);
    console.log(`Nombre de copies mises à jour : ${newCopies}`);
  };

  return (
    <div className="camera-container">
      <div className="camera-left" onClick={textShown ? captureMedia : undefined}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="video-stream"
          style={{
            width: template === "POLAROID" ? '100vh' :
              template === "MINIPOLAROID" ? '720px' :
                template === "PAYSAGE" ? '1614px' : '100%',
            height: '100%', // Maintain full height of the container
            objectFit: 'cover', // Ensures the video fills the container and crops excess
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {template == "PAYSAGE" && (<div className='captured-image-cadre-container'><img className="captured-image-cadre" style={{ aspectRatio: videoRef.current?.videoWidth! + "/" + videoRef.current?.videoHeight! }} src={filtresPAYSAGE[filter]} alt="Captured" /></div>)}
        {template == "POLAROID" && (<div className='captured-image-cadre-container'><img className="captured-image-cadre" style={{ aspectRatio: videoRef.current?.videoWidth! + "/" + videoRef.current?.videoHeight! }} src={filtresPOLAROID[filter]} alt="Captured" /></div>)}
        {template == "MINIPOLAROID" && (<div className='captured-image-cadre-container'><img className="captured-image-cadre" style={{ aspectRatio: videoRef.current?.videoWidth! + "/" + videoRef.current?.videoHeight! }} src={filtresMINIPOLAROID[filter]} alt="Captured" /></div>)}
        {textShown && (
          <div className="overlay-text-left">
            <p style={{ margin: 0, textWrap: "nowrap" }}>Appuies pour prendre une photo</p>
            <p style={{ margin: 0 }} className='photo-anim'></p>
            <p style={{ fontSize: "15vh", margin: 0, height: 0 }} className='touch-anim'>👆</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden"></canvas>
        <div ref={overlayRef} className="white-overlay"></div>
        {countdown > 0 && (
          <div className="countdown-display">
            {countdown}
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
          <img className={`captured-image ${template === 'POLAROID' && showSavingOptions ? 'video-streamPOLA' : ''}`} src={capturedPhoto} alt="Captured" />

          {template === "POLAROID" && (
            <img src={POLAROIDBASE} alt="Polaroid Base" className="captured-image-POLA" />
          )}
        </div>
      )}

      {showSavingOptions && mode === 'PICTURE' && printError !== 'LU' && cadrePOLA !== 0 && template == "POLAROID" && (<img className="captured-image-cadre-BAS" src={cadresPOLAROID[cadrePOLA]} alt="Captured" />)}

      {showSavingOptions && (
        <div className="form-buttons">
          <div style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center"
          }}>

            <div className={`form-button red`} onClick={handleCancel}>RETOUR</div>

            <div className="sauv">
              SAUVEGARDÉ 💾✅
            </div>
            {/* <input
              className={`${mode === 'PICTURE' ? 'email-input-short' : 'email-input-long'}`}
              type="email"
              value={email}
              onFocus={() => setEnteringEmail(true)}
              // onBlur={() => setEnteringEmail(false)}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entres ton adresse email"
            /> */}

            {/* <div className={`form-button active`} onClick={handleSendEmail}>ENVOYER</div> */}

            {mode === 'PICTURE' && printError !== 'LU' && template === 'POLAROID' && (
              <div>
                <div onClick={() => switchCadre(cadrePOLA - 1)} className="form-button navigation left">&lt;</div>
                <div onClick={() => switchCadre(cadrePOLA + 1)} className="form-button navigation right">&gt;</div>
              </div>
            )}

            {config.canPrint && mode === 'PICTURE' && printError !== 'LU' && (
              <div className="form-impr">
                <div onClick={() => putCopies(printCopies - 1)} className="form-button navigation">&lt;</div>
                <div onClick={() => putCopies(0)} className="form-button copies">
                  {"Copies : " + printCopies.toString()}
                </div>
                <div onClick={() => putCopies(printCopies + 1)} className="form-button navigation">&gt;</div>
                <div className={`form-button imp ${printCopies !== 0 ? 'active' : 'inactive'}`} onClick={handlePrint}>IMPRIMER</div>
              </div>
            )}

          </div>
          {/* {enteringEmail && <div style={{ width: "100%"}}>
            <Keyboard
              onChange={onKeyboardChange}
              onKeyPress={onKeyPress}
              layout={layout}
            />
          </div>}      */}
        </div>
      )}

      {!showSavingOptions && showMenu && (
        <div className="camera-buttons">
          {templates.length > 1 && <><div className="camera-button navigation" onClick={() => switchTemplate(-1)}>&lt;</div>
            <div className={`camera-button template`}>{template}</div>
            <div className="camera-button navigation" onClick={() => switchTemplate(+1)}>&gt;</div></>}

          {modes.length > 1 && <div style={{ display: "flex", width: "auto", backgroundColor: 'transparent' }}>
            <div className="camera-button navigation" onClick={() => switchMode(-1)}>&lt;</div>
            <div className={`camera-button mode`}>{mode}</div>
            <div className="camera-button navigation" onClick={() => switchMode(+1)}>&gt;</div>
          </div>}

          {template === "PAYSAGE" && filtresPAYSAGE.length > 1 && (
            <>
              <div className="camera-button navigation" onClick={() => putFilter(filter - 1)}>&lt;</div>
              <div className={`camera-button ${extractTextFromPath(filtresPAYSAGE[filter]) !== "Aucun cadre" ? 'active' : 'inactive'}`}>
                {extractTextFromPath(filtresPAYSAGE[filter])}
              </div>
              <div className="camera-button navigation" onClick={() => putFilter(filter + 1)}>&gt;</div>
            </>
          )}
          {template === "POLAROID" && filtresPOLAROID.length > 1 && (
            <>
              <div className="camera-button navigation" onClick={() => putFilter(filter - 1)}>&lt;</div>
              <div className={`camera-button ${extractTextFromPath(filtresPOLAROID[filter]) !== "Aucun cadre" ? 'active' : 'inactive'}`}>
                {extractTextFromPath(filtresPOLAROID[filter])}
              </div>
              <div className="camera-button navigation" onClick={() => putFilter(filter + 1)}>&gt;</div>
            </>
          )}
          {template === "MINIPOLAROID" && (
            <div className={`camera-button ${extractTextFromPath(filtresMINIPOLAROID[filter]) !== "Aucun cadre" ? 'active' : 'inactive'}`}>
              {extractTextFromPath(filtresMINIPOLAROID[filter])}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-text">Patientez</div>
          <div className="spinner"></div>
        </div>
      )}

      {printError && printError !== 'LU' && (
        <div className="print-error-overlay">
          <div className="print-error-content">
            <div className="print-error-text">{printError}</div>
            <button onClick={() => setPrintError("LU")} className="print-error-button">OK : La photo est sauvegardée</button>
          </div>
        </div>
      )}

      <div className="settings">
        <Settings onCopiesUpdated={handleCopiesUpdated} />
      </div>

    </div>
  );
}

export default Camera;