import { Html5Qrcode, Html5QrcodeCameraScanConfig, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

const qrcodeRegionId = "html5qr-code-full-region";

// Creates the configuration object for Html5QrcodeScanner.
const createConfig = (props: { fps?: number, qrbox?: number, aspectRatio?: number, disableFlip?: boolean }) => {
  let config: Html5QrcodeCameraScanConfig = { fps: 10 };
  if (props.fps) {
    config.fps = props.fps;
  }
  if (props.qrbox) {
    config.qrbox = props.qrbox;
  }
  if (props.aspectRatio) {
    config.aspectRatio = props.aspectRatio;
  }
  if (props.disableFlip !== undefined) {
    config.disableFlip = props.disableFlip;
  }
  return config;
};

const Html5QrcodePlugin = (props: { verbose?: any; qrCodeSuccessCallback?: any; qrCodeErrorCallback?: any; fps?: number | undefined; qrbox?: number | undefined; aspectRatio?: number | undefined; disableFlip?: boolean | undefined; }) => {

  const [debug, setDebug] = useState<string>("")
  useEffect(() => {
    // when component mounts
    const config = createConfig(props);
    const verbose = props.verbose === true;
    setDebug(JSON.stringify(config));
    // Success callback is required.
    if (!(props.qrCodeSuccessCallback)) {
      throw "qrCodeSuccessCallback is required callback.";
    }

    // let html5QrCode: Html5Qrcode;
    // Html5Qrcode.getCameras().then(devices => {
    //   console.log(devices)
    //   /**
    //    * devices would be an array of objects of type:
    //    * { id: "id", label: "label" }
    //    */
    //   if (devices && devices.length) {
    //     const cameraId = devices[0].id;
    //     devices[0].
    //     html5QrCode = new Html5Qrcode(qrcodeRegionId, { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
    //     html5QrCode.start({ deviceId: { exact: cameraId } }, config, props.qrCodeSuccessCallback, props.qrCodeErrorCallback);
    //   }
    // }).catch(err => {
    //   // handle err
    //   setDebug(err);
    // });
    const html5QrCode = new Html5Qrcode(qrcodeRegionId, { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
    html5QrCode.start({
      facingMode: 'user',
    }, config, props.qrCodeSuccessCallback, props.qrCodeErrorCallback)
    // .then(() => {
    //   //@ts-ignore
    //   html5QrCode.applyVideoConstraints({ advanced: [{ zoom: 100 }] })
    // });


    // cleanup function when component will unmount
    return () => {
      if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().then((ignore) => {
        // QR Code scanning is stopped.
        html5QrCode.clear();
      }).catch((err) => {
        // Stop failed, handle it.
        console.log(err);
      });
    };
  }, []);

  return (
    <>
      <div id={qrcodeRegionId} style={{ width: 500, height: "auto" }} />
    </>

  );
};

export default Html5QrcodePlugin;
