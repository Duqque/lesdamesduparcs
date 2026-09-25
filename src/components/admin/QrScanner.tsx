"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { btn } from "./ui";

interface Detector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
  }
}

/** Scanner de QR code (caméra) pour pointer les présences. Nécessite un navigateur compatible (Chrome, Edge, Android). */
export function QrScanner({ inputId, formId }: { inputId: string; formId: string }) {
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState("");
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!on) return;
    let stop = false;
    let stream: MediaStream | null = null;
    (async () => {
      if (!window.BarcodeDetector) {
        setMsg("Ce navigateur ne sait pas lire les QR codes : saisissez le numéro de membre ou collez l'adresse du QR code.");
        setOn(false);
        return;
      }
      try {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        const tick = async () => {
          if (stop || !video.current) return;
          const codes = await detector.detect(video.current).catch(() => []);
          if (codes[0]?.rawValue) {
            const input = document.getElementById(inputId) as HTMLInputElement | null;
            if (input) input.value = codes[0].rawValue;
            setOn(false);
            (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit();
            return;
          }
          setTimeout(tick, 250);
        };
        tick();
      } catch {
        setMsg("Impossible d'accéder à la caméra.");
        setOn(false);
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [on, inputId, formId]);

  return (
    <div>
      <button type="button" onClick={() => { setMsg(""); setOn((v) => !v); }} className={btn.outline}>
        <ScanLine aria-hidden className="size-4" /> {on ? "Arrêter le scan" : "Scanner un QR code"}
      </button>
      {msg && <p className="mt-2 font-body text-[12.5px] text-amber-300">{msg}</p>}
      {on && <video ref={video} muted playsInline className="mt-3 aspect-video w-full max-w-[420px] rounded-[10px] border border-line bg-black object-cover" />}
    </div>
  );
}
