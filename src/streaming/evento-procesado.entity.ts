import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * Idempotencia de los grupos que suman (alertas e historial): un evento se registra aqui EN LA MISMA
 * transaccion que suma. Si el par (grupo, evento_id) ya estaba, la transaccion no suma nada.
 * La clave incluye el grupo porque el mismo evento lo procesa mas de un grupo.
 */
@Entity({ name: 'eventos_procesados' })
export class EventoProcesado {
  @PrimaryColumn({ type: 'text' })
  grupo!: string;

  @PrimaryColumn({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  @CreateDateColumn({ name: 'procesado_en', type: 'timestamptz' })
  procesadoEn!: Date;
}
