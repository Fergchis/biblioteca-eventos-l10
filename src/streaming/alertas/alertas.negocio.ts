import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Procesador, Resultado } from '../consumidor-kafka.js';
import type { EventoDto } from '../evento.dto.js';
import { ventanaDe5MinutosDe } from '../ventanas.js';

// La regla: mas del 20% de las lecturas terminadas de un libro en error, en una ventana fija de 5 minutos.
export const UMBRAL_ERROR = 0.2;
// Y al menos 5 terminadas en la ventana. Con menos, una sola en error ya pasa el 20% (1 de 3 es 33%): en el
// dataset eso dispara dos ventanas de 3 terminadas que no son una racha. La mediana es 2 terminadas por
// ventana y la racha real tiene 59. Justificado en biblioteca-plataforma/docs/consumer-groups.md.
export const MINIMO_TERMINADAS = 5;

const GRUPO = 'biblioteca-alertas';

/**
 * Lo que hace biblioteca-alertas con un evento valido. Solo le sirven las lecturas terminadas. Suma en
 * ventanas_lectura y deja (o retira) la alerta de esa ventana, todo en UNA transaccion con el registro en
 * eventos_procesados: si el evento ya estaba, no suma nada.
 */
@Injectable()
export class AlertasNegocio implements Procesador<EventoDto> {
  constructor(private readonly base: DataSource) {}

  async procesar(e: EventoDto): Promise<Resultado> {
    if (e.tipo !== 'lectura.terminada') return 'ignorado';
    const enError = (e.datos as { resultado: string }).resultado === 'error' ? 1 : 0;
    const ventana = ventanaDe5MinutosDe(e.emitidoEn);

    return this.base.transaction(async (tx) => {
      const nuevo: unknown[] = await tx.query(
        `INSERT INTO eventos_procesados (grupo, evento_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING RETURNING evento_id`,
        [GRUPO, e.eventoId],
      );
      if (nuevo.length === 0) return 'duplicado';

      const [v] = await tx.query<{ terminadas: number; en_error: number }[]>(
        `INSERT INTO ventanas_lectura (libro_id, ventana, terminadas, en_error) VALUES ($1, $2, 1, $3)
         ON CONFLICT (libro_id, ventana) DO UPDATE
           SET terminadas = ventanas_lectura.terminadas + 1, en_error = ventanas_lectura.en_error + EXCLUDED.en_error
         RETURNING terminadas, en_error`,
        [e.libroId, ventana, enError],
      );
      // Con cada terminada se vuelve a evaluar la ventana: una ventana que paso el 20% con pocas terminadas
      // puede bajar despues. Las lecturas de un libro llegan en orden (key libroId), asi que al terminar de
      // leer queda exactamente la alerta de las ventanas que cumplen la regla con sus cifras finales.
      if (v.terminadas >= MINIMO_TERMINADAS && v.en_error > UMBRAL_ERROR * v.terminadas) {
        await tx.query(
          `INSERT INTO alertas (libro_id, ventana, terminadas, en_error) VALUES ($1, $2, $3, $4)
           ON CONFLICT (libro_id, ventana) DO UPDATE
             SET terminadas = EXCLUDED.terminadas, en_error = EXCLUDED.en_error, actualizada_en = now()`,
          [e.libroId, ventana, v.terminadas, v.en_error],
        );
      } else {
        await tx.query(`DELETE FROM alertas WHERE libro_id = $1 AND ventana = $2`, [e.libroId, ventana]);
      }
      return 'nuevo';
    });
  }
}
