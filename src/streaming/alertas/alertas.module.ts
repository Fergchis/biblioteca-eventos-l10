import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module.js';
import { AlertasConsumidor } from './alertas.consumidor.js';
import { AlertasNegocio } from './alertas.negocio.js';

@Module({
  imports: [PersistenciaModule],
  providers: [AlertasNegocio, AlertasConsumidor],
})
export class AlertasModule {}
