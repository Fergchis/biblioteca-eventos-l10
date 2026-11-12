import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MINIMO_TERMINADAS, UMBRAL_ERROR } from '../alertas/alertas.negocio.js';

const ZONA = 'America/Santiago';

type FilaMinuto = { minuto: Date; hora: string; iniciadas: number; terminadas: number; en_curso: number; prestamos: number };
type FilaLibro = { libro_id: string; titulo: string | null; en_curso: number; prestamos: number };
type FilaAlerta = { libro_id: string; titulo: string | null; desde: string; hasta: string; terminadas: number; en_error: number };

/**
 * Lo que lee el panel. biblioteca-eventos es el dueno de kpi_minuto y alertas: el BFF pide esto por HTTP y
 * nunca se conecta a Postgres. Las horas salen en hora de Chile; lo guardado esta en UTC.
 */
@Injectable()
export class PanelEnVivoService {
  constructor(private readonly base: DataSource) {}

  async enVivo() {
    const [minutos, libros, alertas] = await Promise.all([
      this.base.query<FilaMinuto[]>(
        `SELECT minuto, to_char(minuto AT TIME ZONE '${ZONA}', 'HH24:MI') AS hora,
                iniciadas, terminadas, prestamos,
                sum(iniciadas - terminadas) OVER (ORDER BY minuto)::int AS en_curso
           FROM (SELECT minuto,
                        count(*) FILTER (WHERE tipo = 'lectura.iniciada')::int  AS iniciadas,
                        count(*) FILTER (WHERE tipo = 'lectura.terminada')::int AS terminadas,
                        count(*) FILTER (WHERE tipo = 'prestamo.creado')::int   AS prestamos
                   FROM kpi_minuto GROUP BY minuto) AS m
          ORDER BY minuto`,
      ),
      this.base.query<FilaLibro[]>(
        `SELECT k.libro_id, c.titulo,
                (count(*) FILTER (WHERE k.tipo = 'lectura.iniciada') - count(*) FILTER (WHERE k.tipo = 'lectura.terminada'))::int AS en_curso,
                count(*) FILTER (WHERE k.tipo = 'prestamo.creado')::int AS prestamos
           FROM kpi_minuto k LEFT JOIN catalogo_libros c ON c.libro_id = k.libro_id
          GROUP BY k.libro_id, c.titulo
          ORDER BY en_curso DESC, prestamos DESC, k.libro_id`,
      ),
      this.base.query<FilaAlerta[]>(
        `SELECT a.libro_id, c.titulo, a.terminadas, a.en_error,
                to_char(a.ventana AT TIME ZONE '${ZONA}', 'HH24:MI') AS desde,
                to_char((a.ventana + interval '5 minutes') AT TIME ZONE '${ZONA}', 'HH24:MI') AS hasta
           FROM alertas a LEFT JOIN catalogo_libros c ON c.libro_id = a.libro_id
          ORDER BY a.ventana, a.libro_id`,
      ),
    ]);

    const ultimo = minutos.at(-1);
    const maximo = minutos.reduce<FilaMinuto | undefined>((max, m) => (!max || m.en_curso > max.en_curso ? m : max), undefined);
    return {
      zonaHoraria: ZONA,
      generadoEn: new Date().toISOString(),
      hasta: ultimo ? ultimo.hora : null,
      totales: {
        lecturasIniciadas: minutos.reduce((s, m) => s + m.iniciadas, 0),
        lecturasTerminadas: minutos.reduce((s, m) => s + m.terminadas, 0),
        lecturasEnCurso: ultimo?.en_curso ?? 0,
        prestamos: minutos.reduce((s, m) => s + m.prestamos, 0),
      },
      maximoEnCurso: maximo ? { hora: maximo.hora, lecturas: maximo.en_curso } : null,
      porMinuto: minutos.map((m) => ({
        minuto: m.minuto, hora: m.hora, iniciadas: m.iniciadas, terminadas: m.terminadas,
        enCurso: m.en_curso, prestamos: m.prestamos,
      })),
      porLibro: libros.map((l) => ({ libroId: l.libro_id, titulo: l.titulo, enCurso: l.en_curso, prestamos: l.prestamos })),
      regla: { umbralError: UMBRAL_ERROR, minimoTerminadas: MINIMO_TERMINADAS, ventanaMinutos: 5 },
      alertas: alertas.map((a) => ({
        libroId: a.libro_id, titulo: a.titulo, desde: a.desde, hasta: a.hasta,
        terminadas: a.terminadas, enError: a.en_error,
        porcentaje: Math.round((1000 * a.en_error) / a.terminadas) / 10,
      })),
    };
  }
}
