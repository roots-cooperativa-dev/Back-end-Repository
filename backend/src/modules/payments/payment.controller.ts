import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Get,
  Req,
  Logger,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payment.service';
import {
  CreatePreferenceDto,
  PaymentStatusDto,
  PreferenceResponseDto,
} from './dto/create-payment.dto';
import { WebhookNotificationDto } from './dto/create-payment.dto';
import { WebhookNotificationDto as WebhookNotificationInterface } from './interface/patment.interface';

// Type guard mejorado para verificar estructura básica del webhook
function hasWebhookStructure(
  obj: unknown,
): obj is { type: string; data: unknown } {
  return (
    typeof obj === 'object' && obj !== null && 'type' in obj && 'data' in obj
  );
}

// Type guard flexible para diferentes tipos de data en webhook
function hasValidWebhookData(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null;
}

// Interface para el objeto de respuesta con error
interface WebhookResponse {
  status: string;
  message?: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-preference/:userId')
  @ApiOperation({ summary: 'Create payment preference for donation' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'ID of the user making the donation',
  })
  @ApiBody({ type: CreatePreferenceDto })
  @ApiResponse({
    status: 201,
    description: 'Payment preference successfully created',
    type: PreferenceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or user not found',
  })
  async createPreference(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createPreferenceDto: CreatePreferenceDto,
  ): Promise<PreferenceResponseDto> {
    return await this.paymentsService.createPreference(
      userId,
      createPreferenceDto,
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Receive payment webhook notifications' })
  @ApiBody({ type: WebhookNotificationDto })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleWebhook(
    @Body() notification: unknown,
    @Req() req: Request,
  ): Promise<WebhookResponse> {
    try {
      this.logger.log('=== WEBHOOK DEBUG START ===');

      // Log completo del body recibido (safe)
      this.logger.log(`Raw body: ${JSON.stringify(notification, null, 2)}`);

      // Log de headers importantes
      this.logger.log(`Content-Type: ${req.headers['content-type'] || 'N/A'}`);
      this.logger.log(`User-Agent: ${req.headers['user-agent'] || 'N/A'}`);

      const xSignature = req.headers['x-signature'];
      const xSignatureStr = Array.isArray(xSignature)
        ? xSignature.join(', ')
        : xSignature || 'N/A';
      this.logger.log(`X-Signature: ${xSignatureStr}`);

      // Verificar si el body está vacío
      if (
        !notification ||
        (typeof notification === 'object' &&
          Object.keys(notification).length === 0)
      ) {
        this.logger.warn('⚠️ Empty webhook body received');
        return { status: 'empty_body' };
      }

      // Verificar estructura básica con type guard
      if (!hasWebhookStructure(notification)) {
        this.logger.warn('❌ Invalid webhook structure - missing type or data');
        return { status: 'invalid_structure' };
      }

      // Safe access después de verificación
      const notificationKeys =
        typeof notification === 'object' && notification !== null
          ? Object.keys(notification).join(', ')
          : 'unknown';

      this.logger.log(`Notification keys: ${notificationKeys}`);
      this.logger.log(`Type: ${notification.type}`);
      this.logger.log(`Data: ${JSON.stringify(notification.data)}`);

      // Safe access para ID
      const notificationId =
        typeof notification === 'object' &&
        notification !== null &&
        'id' in notification
          ? String((notification as Record<string, unknown>).id)
          : 'unknown';
      this.logger.log(`ID: ${notificationId}`);

      // Verificar si tiene datos válidos con type guards mejorados
      if (notification.type && hasValidWebhookData(notification.data)) {
        this.logger.log('✅ Valid webhook structure, processing...');

        // Helper function para safe access
        const safeGet = (obj: unknown, key: string): unknown => {
          return typeof obj === 'object' && obj !== null && key in obj
            ? (obj as Record<string, unknown>)[key]
            : undefined;
        };

        // Helper function para convertir valores a string de forma segura
        const safeStringify = (value: unknown): string => {
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'string' || typeof value === 'number') {
            return String(value);
          }
          return '';
        };

        // Determinar el ID a usar según el tipo de webhook
        let dataId: string;

        if (notification.type === 'payment' && 'id' in notification.data) {
          // Para webhooks de payment, usar data.id
          dataId = safeStringify(notification.data.id);
        } else if (notification.type === 'topic_merchant_order_wh') {
          // Para webhooks de merchant order, usar el ID principal del webhook
          dataId = safeStringify(safeGet(notification, 'id'));
        } else {
          // Para otros tipos, intentar usar data.id o el ID principal
          const dataIdValue = safeGet(notification.data, 'id');
          const notificationIdValue = safeGet(notification, 'id');
          dataId =
            safeStringify(dataIdValue) || safeStringify(notificationIdValue);
        }

        if (!dataId) {
          this.logger.warn('❌ No valid ID found in webhook data');
          return { status: 'no_valid_id' };
        }

        // Crear objeto usando la interfaz correcta que espera el servicio
        const validatedNotification: WebhookNotificationInterface = {
          id: Number(safeGet(notification, 'id')) || 0,
          type: notification.type,
          data: { id: dataId },
          // Asegurar que live_mode sea siempre boolean
          live_mode:
            safeGet(notification, 'live_mode') !== undefined
              ? Boolean(safeGet(notification, 'live_mode'))
              : false,
          // La interfaz requiere string, no string | undefined
          date_created: safeStringify(safeGet(notification, 'date_created')),
          // La interfaz requiere number, no number | undefined
          application_id:
            safeGet(notification, 'application_id') !== undefined
              ? Number(safeGet(notification, 'application_id')) || 0
              : 0,
          // La interfaz requiere string, no string | undefined
          user_id: safeStringify(safeGet(notification, 'user_id')),
          // La interfaz requiere number, no number | undefined
          version:
            safeGet(notification, 'version') !== undefined
              ? Number(safeGet(notification, 'version')) || 0
              : 0,
          // La interfaz requiere string, no string | undefined
          api_version: safeStringify(safeGet(notification, 'api_version')),
          // La interfaz requiere string, no string | undefined
          action: safeStringify(safeGet(notification, 'action')),
        };

        await this.paymentsService.handleWebhook(validatedNotification);
        this.logger.log('=== WEBHOOK DEBUG END - SUCCESS ===');
        return { status: 'success' };
      } else {
        this.logger.warn('❌ Invalid webhook data structure');
        this.logger.log('=== WEBHOOK DEBUG END - INVALID DATA ===');
        return { status: 'invalid_data' };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Webhook handler error: ${errorMessage}`);
      this.logger.log('=== WEBHOOK DEBUG END - ERROR ===');

      return { status: 'error', message: errorMessage };
    }
  }

  @Get('status/:paymentId')
  @ApiOperation({ summary: 'Check payment status by payment ID' })
  @ApiParam({
    name: 'paymentId',
    type: String,
    description: 'Payment ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully',
    type: PaymentStatusDto,
  })
  async getPaymentStatus(
    @Param('paymentId') paymentId: string,
  ): Promise<PaymentStatusDto> {
    return await this.paymentsService.getPaymentStatus(paymentId);
  }
}
