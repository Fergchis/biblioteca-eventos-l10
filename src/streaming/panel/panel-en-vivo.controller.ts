import { Controller, Get } from '@nestjs/common';
import { PanelEnVivoService } from './panel-en-vivo.service.js';

/**
 * GET /panel/en-vivo: solo lo llama el BFF, por la red interna. No pide token: el BFF ya reviso que quien
 * pregunta es bibliotecario, y este puerto no se publica fuera de la red de los servicios en la nube.
 */
@Controller('panel')
export class PanelEnVivoController {
  constructor(private readonly panel: PanelEnVivoService) {}

  @Get('en-vivo')
  enVivo() {
    return this.panel.enVivo();
  }
}
