import { useState } from 'react';
import "./Settings.css"

const CODE = "2518";

function Settings({ onCopiesUpdated, onPrint, setNewConfig, credits  }: { credits: number; onCopiesUpdated: (copies: string) => void; onPrint: () => void; setNewConfig:(config : string) => void}) {
  const [showPad, setShowPad] = useState(false);
  const [clickCounter, setClickCounter] = useState(0);
  const [code, setCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [copies, setCopies] = useState('');
  const backendAdress = process.env.REACT_APP_BACKEND_ADRESS ?? 'http://127.0.0.1:3001'


   // Fonction pour récupérer l'adresse IP depuis le backend
   const fetchIPAddress = async () => {
    try {
      const response = await fetch(`${backendAdress}/ip`);
      if (response.ok) {
        const data = await response.json();
        // Récupérer la première adresse IPv4 trouvée
        const firstIP = Object.values(data).flat()[0];
        if (typeof firstIP === 'string') {
          setIpAddress(firstIP);
        } else {
          setIpAddress('Adresse IP non disponible');
        }
      } else {
        console.error('Erreur lors de la récupération de l\'adresse IP');
        setIpAddress('Erreur lors de la récupération de l\'adresse IP');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setIpAddress('Erreur réseau');
    }
  };

  const handleClick = () => {
    setClickCounter(clickCounter + 1);
    if (clickCounter === 3) {
      setShowPad(!showPad);
      setClickCounter(0);
    } else {
      setShowPad(false);
    }
  };

  const handleInput = (digit: string | number) => {
    if (!isCodeValid && code.length < 4) {
      setCode(code + digit);
    } else if (isCodeValid && copies.length < 3) {
      setCopies(copies + digit);
    }
  };

  const handleDelete = () => {
    if (!isCodeValid) {
      setCode(code.slice(0, -1));
    } else {
      setCopies(copies.slice(0, -1));
    }
  };

  const handleSubmitCode = () => {
    if (code === CODE) {
      setIsCodeValid(true); // Le code est correct, demander maintenant le nombre de copies
      fetchIPAddress();
    } else {
      setCode('');
    }
  };
  

  const handleSubmitCopies = async () => {
    // Envoyer le nombre de copies au backend
    try {
      const response = await fetch(`${backendAdress}/updateCopies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ copies }),
      });

      const result = await response.json();
      if (response.ok) {
        console.log('Nombre de copies envoyé avec succès:', result);
        alert('Nombre de copies envoyé avec succès!');
        onCopiesUpdated(copies);
        setShowPad(false);
        setIsCodeValid(false);
        setCode('');
        setCopies('');
      } else {
        console.error('Erreur lors de l\'envoi:', result);
        alert('Erreur lors de l\'envoi des copies');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur réseau');
    }
  };

  const handleRebootMachine = async () => {
    // Envoyer le nombre de copies au backend
    try {
      const response = await fetch(`${backendAdress}/reboot`, { method: 'POST' });
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur réseau' + error);
    }
  };

  const handleShutdownMachine = async () => {
    // Envoyer le nombre de copies au backend
    try {
      const response = await fetch(`${backendAdress}/shutdown`, { method: 'POST' });
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur réseau' + error);
    }
  };

  const closeSettings = () => {
    setShowPad(false);
    setIsCodeValid(false);
    setCode("")
  }

  const handleQuitApplication = async () => {
    try {
      const response = await fetch(`${backendAdress}/quit`, { method: 'POST' });
      if (response.ok) {
        alert('L\'application va se fermer.');
      } else {
        console.error('Erreur lors de la fermeture de l\'application');
        alert('Erreur lors de la fermeture de l\'application');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur réseau' + error);
    }
  };  

  const handleRestartApplication = async () => {
    try {
      const response = await fetch(`${backendAdress}/cupsenable`, { method: 'POST' });
      if (response.ok) {
        alert('L\'application va restart.');
      } else {
        console.error('Erreur lors du restart de l\'application');
        alert('Erreur lors du restart de l\'application');
      }
      window.location.reload()
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur réseau' + error);
    }
  };  


  return (
    <div className='settings'>
      <div
        className="settings-btn"
        onClick={handleClick}
      />


      {showPad && (
        <div className="num-pad-overlay">
          <div className="num-pad">
            {!isCodeValid ? (
              <>
                Paramètres
                <button onClick={closeSettings} className='close-btn'>X</button>
                <input
                  type="password"
                  className="code-input"
                  value={code}
                  placeholder='code'
                  readOnly
                />
                <div className="num-buttons">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit, index) => (
                    <button key={digit} onClick={() => handleInput(digit)}>
                      {digit}
                    </button>
                  ))}
                  <button onClick={handleDelete}>Del</button>
                  <button onClick={handleSubmitCode}>OK</button>
                </div>
              </>
            ) : (
              <>
                Paramètres
                <button onClick={closeSettings} className='close-btn'>X</button>
                <div className='horizontal'>
                  <p>{credits} crédits</p>
                  <button onClick={() => { handleRestartApplication() }}>Restart app</button>

                  {/* <button onClick={handleQuitApplication}>Quitter l'application</button> */}
                </div>

                <div className='horizontal'>
                  <button onClick={handleShutdownMachine}>Shutdown</button>
                  <button onClick={handleRebootMachine}>Reboot</button>
                  <button onClick={onPrint}>Imprimer</button>
                </div>

                <div className='horizontal'>
                <button onClick={() => setNewConfig("debugConfig")}>Qr Code</button>
                <button onClick={() => setNewConfig("fullDigitalConfig")}>Full Digital</button>
                {ipAddress && (
                  <p>{ipAddress}</p>
                )}
                </div>


                
                                
                <input
                  type="number"
                  className="copies-input"
                  value={copies}
                  placeholder="Nombre de copies"
                  readOnly
                />
                <div className="num-buttons">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
                    <button key={digit} onClick={() => handleInput(digit)}>
                      {digit}
                    </button>
                  ))}
                  <button onClick={handleDelete}>Del</button>
                  <button onClick={handleSubmitCopies}>OK</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;