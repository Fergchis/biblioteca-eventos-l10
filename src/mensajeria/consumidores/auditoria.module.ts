import { Module } from '@nestjs/common';
import { PersistenciaModule } from '../../persistencia/persistencia.module.js';
import { MensajeriaModule } from '../mensajeria.module.js';
import { AuditoriaConsumidor } from './auditoria.consumidor.js';

@Module({
  imports: [MensajeriaModule, PersistenciaModule],
  providers: [AuditoriaConsumidor],
})
export class AuditoriaModule {}
