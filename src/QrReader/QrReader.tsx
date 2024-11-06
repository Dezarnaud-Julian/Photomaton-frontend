import { useEffect, useRef, useState } from "react";
import "./QrReader.css";
import { QrReader } from 'react-qr-reader';
import QrScannerImage from './scann.png';

const QrReaderComponent = (props: {handlePrintQrCode : () => void}) => {
    const backendAdress = process.env.REACT_APP_BACKEND_ADRESS ?? 'http://127.0.0.1:3001'
    const [scannedResult, setScannedResult] = useState<string | undefined>("");

   // Dans le composant enfant qui gère le scan
    const onScanSuccess = async (result: string) => {
        console.log('Scan result:', result);
        try {
            const response = await fetch(`${backendAdress}/checkCode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: result }),
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
            }
        } catch (error) {
            console.error('Error checking code:', error);
        }
    };

    return (
        <div className="qr-reader">
            <QrReader
                onResult={(result:any, error:any) => {
                    if (!!result) {
                        setScannedResult(result.getText());
                        onScanSuccess(result.getText());
                    }

                    if (!!error) {
                        console.info(error);
                    }
                }}
                constraints={{}}
            />

            {scannedResult && (
                <p className="qr-result">
                    Scan éffectué : {scannedResult}
                </p>
            )}
        </div>
    );
};

export default QrReaderComponent;