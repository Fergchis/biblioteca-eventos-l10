import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * biblioteca-panel: UNA FILA POR EVENTO. La clave primaria es evento_id, asi que un duplicado no entra
 * (ON CONFLICT DO NOTHING) y el panel suma con GROUP BY al leer. Solo se guardan los tres tipos que el
 * panel cuenta: lectura.iniciada, lectura.terminada y prestamo.creado.
 */
@Entity({ name: 'kpi_minuto' })
@Index('ix_kpi_minuto_minuto', ['minuto'])
export class KpiMinuto {
  @PrimaryColumn({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  // El minuto de emitidoEn (la hora del evento, en UTC), no la hora en que llego a Kafka.
  @Column({ type: 'timestamptz' })
  minuto!: Date;

  @Column({ name: 'libro_id', type: 'text' })
  libroId!: string;

  @Column({ type: 'text' })
  tipo!: string;
}
