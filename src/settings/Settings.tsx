import { useState } from 'react';
import "./Settings.css"

const CODE = "2518";

function Settings({ onCopiesUpdated }: { onCopiesUpdated: (copies: string) => void }) {
  const [showPad, setShowPad] = useState(false);
  const [clickCounter, setClickCounter] = useState(0);
  const [code, setCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [copies, setCopies] = useState('');
  const backendAdress = process.env.REACT_APP_BACKEND_ADRESS ?? 'http://127.0.0.1:3001'


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
                  <button onClick={() => { window.location.reload() }}>Restart app</button>
                  <button onClick={() => { window.close() }}>Close app</button>
                  <button onClick={handleShutdownMachine}>Shutdown</button>
                  <button onClick={handleRebootMachine}>Reboot</button>
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