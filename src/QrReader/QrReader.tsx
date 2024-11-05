import { useEffect, useRef, useState } from "react";
import "./QrReader.css";
import QrScanner from "qr-scanner";
import QrScannerImage from './scann.png';

interface QrReaderProps {
    handlePrint: () => void;
}

const QrReader: React.FC<QrReaderProps> = (props) => {
    // QR States
    const {handlePrint } = props;
    const scanner = useRef<QrScanner>();
    const videoEl = useRef<HTMLVideoElement>(null);
    const qrBoxEl = useRef<HTMLDivElement>(null);
    const [qrOn, setQrOn] = useState<boolean>(true);
    const backendAdress = process.env.REACT_APP_BACKEND_ADRESS ?? 'http://127.0.0.1:3001'


    // Result
    const [scannedResult, setScannedResult] = useState<string | undefined>("");

   // Dans le composant enfant qui gère le scan
    const onScanSuccess = async (result: QrScanner.ScanResult) => {
        console.log('Scan result:', result);
        try {
            const response = await fetch(`${backendAdress}/checkCode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: result.data }),
            });

            if (!response.ok) {
                throw new Error('Failed to check code');
            }

            const data = await response.json();
            setScannedResult(data.message);
            console.log('Backend response message:', data.message);

            // Vérifiez si le message est "IMPRESSION" et appelez handlePrint
            if (data.message === "IMPRESSION") {
                props.handlePrint(); // Appelez handlePrint via les props
            }
        } catch (error) {
            console.error('Error checking code:', error);
        }
    };


    

    // Fail
    const onScanFail = (err: string | Error) => {
        console.log(err);
    };

    useEffect(() => {
        if (videoEl?.current && !scanner.current) {
            scanner.current = new QrScanner(videoEl?.current, onScanSuccess, {
                onDecodeError: onScanFail,
                preferredCamera: "environment",
                highlightScanRegion: true,
                highlightCodeOutline: true,
                overlay: qrBoxEl?.current || undefined,
            });

            scanner?.current
                ?.start()
                .then(() => setQrOn(true))
                .catch((err: any) => {
                    if (err) setQrOn(false);
                });
        }

        return () => {
            if (!videoEl?.current) {
                scanner?.current?.stop();
            }
        };
    }, []);

    useEffect(() => {
        if (!qrOn)
            alert(
                "Camera is blocked or not accessible. Please allow camera in your browser permissions and Reload."
            );
    }, [qrOn]);

    return (
        <div className="qr-reader">
            <video ref={videoEl}></video>
            <div ref={qrBoxEl} className="qr-box">
                {!videoEl?.current && (
                    <img
                        src={QrScannerImage}
                        alt="Qr Frame"
                        width={280}
                        height={280}
                        className="qr-frame"
                    />
                )}
            </div>

            {scannedResult && (
                <p
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 99999,
                        color: "white",
                    }}>
                    Scanned Result: {scannedResult}
                </p>
            )}
        </div>
    );
};

export default QrReader;