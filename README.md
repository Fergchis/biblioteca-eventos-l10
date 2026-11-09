# biblioteca-eventos

| Qué falla | Qué hace el consumidor | Por qué |
|---|---|---|
| JSON roto, falta `x-evento-id` o un campo obligatorio, o Postgres rechaza el dato (códigos `22...` y `23...`) | `nack(mensaje, false, false)` de inmediato | Reintentar no lo arregla nunca |
| El `insert` choca con `23505` | `ack` | Ya estaba guardado: es la reentrega del 2.3 |
| Cualquier otro error de la base (`ECONNREFUSED`, conexión cortada) | Hasta tres intentos, esperando 2 s y después 4 s; si se agotan, `nack(mensaje, false, false)` | El mensaje está bien; el que está mal es el entorno |

## Kafka (L9): el consumidor `biblioteca-panel`

`src/streaming/` es un módulo propio, aparte de los consumidores de RabbitMQ de arriba. El grupo `biblioteca-panel`
lee **los dos topics**, `biblioteca.prestamos` y `biblioteca.lecturas`, y deja una línea en el log por evento. Es el
embrión del panel de la E2. Variable: `KAFKA_BROKERS` (en el equipo, `localhost:9092,localhost:9094,localhost:9096`;
en el compose, `broker-1:19092,broker-2:19092,broker-3:19092`).

| Archivo | Qué es |
|---|---|
| `src/streaming/topics.ts` | `TOPICS`: los nombres de los dos topics |
| `src/streaming/evento.dto.ts` | El sobre y los `datos` de los cinco tipos de evento, con `class-validator` |
| `src/streaming/panel.consumidor.ts` | El consumidor: `autocommit: false`, `COMMITTED` con respaldo `EARLIEST`, commit después de procesar, `close()` en `onModuleDestroy` |
| `src/streaming/streaming.module.ts` | El módulo de Nest |

| Qué llega | Qué hace el consumidor | Por qué |
|---|---|---|
| Un evento válido | Lo registra (`topic[partición]@offset tipo evento id libro usuario`) y confirma | Es el camino normal |
| No es JSON, o no cumple el DTO | Lo registra como `INVALIDO` con el motivo y **confirma igual** | Uno solo no puede detener al consumidor; en la E3 estos se desvían al `.dlt` |
| Un duplicado (mismo `eventoId`) | Lo registra y confirma, como si fuera nuevo | Hacerlo idempotente es de la E2 |

El grupo sigue desde su último commit; la primera vez parte del principio del topic. Con `app.enableShutdownHooks()` en
`main.ts`, parar el contenedor cierra el consumidor y el siguiente arranque tarda milisegundos. Si cae el clúster
entero, el consumidor se detiene (el log dice `el consumidor se detuvo`) y hay que reiniciar `eventos`: con uno o dos
brokers caídos sigue leyendo.

Para ver el avance: `docker compose exec broker-1 /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server
broker-1:19092 --describe --group biblioteca-panel` (desde `biblioteca-plataforma`), con `LAG` en 0 en las seis
particiones cuando termina de leer.
