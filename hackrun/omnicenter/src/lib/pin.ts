import "server-only";
import { createHash, randomInt } from "crypto";
export const novoPin = () => String(randomInt(1000, 10000));
/** O PIN nunca é guardado em texto: só o hash com sal secreto. A consulta exige protocolo + PIN. */
export const hashPin = (pin: string) => createHash("sha256").update(`${process.env.PIN_SALT}:${pin}`).digest("hex");
