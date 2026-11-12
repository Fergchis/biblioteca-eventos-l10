// Las ventanas se calculan con emitidoEn, la hora del evento (UTC), no con la hora en que el mensaje llego a
// Kafka, que es la de la reproduccion. Se truncan en milisegundos desde 1970, que es UTC; Chile esta a horas
// enteras de UTC, asi que el minuto y la ventana de 5 minutos son los mismos en las dos zonas.
const MINUTO_MS = 60_000;

export const minutoDe = (emitidoEn: string): string =>
  new Date(Math.floor(Date.parse(emitidoEn) / MINUTO_MS) * MINUTO_MS).toISOString();

export const ventanaDe5MinutosDe = (emitidoEn: string): string =>
  new Date(Math.floor(Date.parse(emitidoEn) / (5 * MINUTO_MS)) * 5 * MINUTO_MS).toISOString();
