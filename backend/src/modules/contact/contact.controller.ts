import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact-dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Enviar formulario de contacto' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado correctamente.' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos en el formulario.',
  })
  async submitContactForm(@Body() contactDto: ContactDto) {
    await this.contactService.handleContactForm(contactDto);
    return { message: 'Mensaje enviado' };
  }
}
