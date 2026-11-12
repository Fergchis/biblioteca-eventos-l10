import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * biblioteca-historial: cada prestamo creado, para asociarle su devolucion. prestamo.devuelto no dice en que
 * semana se presto: se busca aqui por prestamoId. Llega despues que el creado y a la misma particion, porque
 * los dos llevan la key usuarioSub.
 */
@Entity({ name: 'prestamos_vistos' })
export class PrestamoVisto {
  @PrimaryColumn({ name: 'prestamo_id', type: 'text' })
  prestamoId!: string;

  @Column({ type: 'date' })
  semana!: string;

  @Column({ name: 'libro_id', type: 'text' })
  libroId!: string;

  @Column({ type: 'boolean' })
  devuelto!: boolean;
}
