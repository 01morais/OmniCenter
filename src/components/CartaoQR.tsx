"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function CartaoQR({ url, codigo, local }: { url: string; codigo: string; local: string }) {
  const [img, setImg] = useState("");
  useEffect(() => { QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: "#12332E", light: "#FFFFFF" } }).then(setImg); }, [url]);
  const imprimir = () => {
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<body style="font-family:sans-serif;text-align:center"><h1>${local}</h1><img src="${img}" width="360"><h2>Escaneie para pedir ajuda</h2><p>${codigo}</p></body>`);
    w.document.close(); w.print();
  };
  return (
    <div className="text-center">
      {img && <img src={img} alt={`QR Code ${codigo}`} className="mx-auto w-40" />}
      <p className="font-bold">{codigo}</p><p className="text-sm text-musgo">{local}</p>
      <button className="btn !min-h-[40px] mt-1 w-full text-sm" onClick={imprimir}>Imprimir</button>
    </div>
  );
}
