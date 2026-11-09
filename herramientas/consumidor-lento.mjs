// L7 · Consume de la cola auditoria, informa lo que recibio y NO hace ack nunca.
// Existe para una sola cosa: ver con tus ojos que un mensaje sin ack no se pierde.
// Uso, desde biblioteca-plataforma:
//   docker compose run --rm --no-deps eventos node herramientas/consumidor-lento.mjs     prefetch 1
//   docker compose run --rm --no-deps eventos node herramientas/consumidor-lento.mjs 5   prefetch 5
import { connect } from 'amqplib';

const cuantos = Number(process.argv[2] ?? 1);

const conexion = await connect(process.env.RABBITMQ_URL);
const canal = await conexion.createChannel();
await canal.prefetch(cuantos);

console.log(`prefetch en ${cuantos}. Escuchando auditoria y sin hacer ack. Corta con Ctrl+C.`);

await canal.consume(
  'auditoria',
  (mensaje) => {
    if (mensaje === null) return;
    const id = mensaje.properties.headers?.['x-evento-id'];
    console.log(`recibido, sin ack: ${mensaje.fields.routingKey} ${id}`);
  },
  { noAck: false },
);
