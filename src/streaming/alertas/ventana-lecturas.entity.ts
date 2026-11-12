import { Column, Entity, PrimaryColumn } from 'typeorm';

/** biblioteca-alertas: cuantas lecturas terminaron y cuantas en error, por libro y ventana fija de 5 minutos. */
@Entity({ name: 'ventanas_lectura' })
export class VentanaLecturas {
  @PrimaryColumn({ name: 'libro_id', type: 'text' })
  libroId!: string;

  // Inicio de la ventana: emitidoEn truncado a 5 minutos (UTC).
  @PrimaryColumn({ type: 'timestamptz' })
  ventana!: Date;

  @Column({ type: 'int' })
  terminadas!: number;

  @Column({ name: 'en_error', type: 'int' })
  enError!: number;
}
