import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module.js';
import { HistorialConsumidor } from './historial.consumidor.js';
import { HistorialNegocio } from './historial.negocio.js';

@Module({
  imports: [PersistenciaModule],
  providers: [HistorialNegocio, HistorialConsumidor],
})
export class HistorialModule {}
