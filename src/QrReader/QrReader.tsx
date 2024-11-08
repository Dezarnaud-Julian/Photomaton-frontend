import { useState } from "react";
import "./QrReader.css";
import targetScan from "./scann.png"
import Html5QrcodePlugin from "./Html5QrcodePlugin";
import { relative } from "path";

const QrReaderComponent = (props: { handlePrintQrCode: () => void }) => {
  const backendAdress = process.env.REACT_APP_BACKEND_ADRESS ?? 'http://127.0.0.1:3001'
  const [scannedResult, setScannedResult] = useState<string | undefined>("");
  const [error, setError] = useState<string | undefined>("");

  // Dans le composant enfant qui gère le scan
  const onNewScanResult = async (decodedText: string, decodedResult: any) => {
    console.log('Scan result:', decodedText, decodedResult);
    setScannedResult(decodedText);
    try {
      const response = await fetch(`${backendAdress}/checkCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: decodedText }),
      });

      if (!response.ok) {
        throw new Error('Failed to check code');
      }

      const data = await response.json();
      setScannedResult(data.message);
      console.log('Backend response message:', data.message);

      // Vérifiez si le message est "IMPRESSION" et appelez handlePrintQrCode
      if (data.message === "IMPRESSION") {
        props.handlePrintQrCode(); // Appelez handlePrintQrCode via les props
        setScannedResult("");
      }
    } catch (error) {
      console.error('Error checking code:', error);
    }
  };

  return (
    <>
      <div style={{ position: 'relative' }}>
        <Html5QrcodePlugin
          fps={1}
          qrbox={500}
          disableFlip={false}
          qrCodeSuccessCallback={onNewScanResult}
          qrCodeErrorCallback={(err: any) => {
            setError(err)
          }}
        />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
          <img src={targetScan} style={{ height: "80%" }}></img>
        </div>
      </div>
      {scannedResult && (
        <p className="qr-result">
          Scan effectué : {scannedResult}
        </p>
      )}
    </>
  );
};

export default QrReaderComponent;