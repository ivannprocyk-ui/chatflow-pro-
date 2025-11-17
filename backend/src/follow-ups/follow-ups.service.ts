import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateSequenceDto } from './dto/create-sequence.dto';
import { UpdateSequenceDto } from './dto/update-sequence.dto';
import { StartExecutionDto } from './dto/start-execution.dto';
import { FollowUpSequence } from './entities/follow-up-sequence.entity';
import { FollowUpMessage } from './entities/follow-up-message.entity';
import { FollowUpExecution } from './entities/follow-up-execution.entity';
import { FollowUpMessageLog } from './entities/follow-up-message-log.entity';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class FollowUpsService {
  private readonly logger = new Logger(FollowUpsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  // =====================================================
  // CRUD DE SECUENCIAS
  // =====================================================

  /**
   * Crear una nueva secuencia de seguimiento
   */
  async createSequence(organizationId: string, dto: CreateSequenceDto): Promise<FollowUpSequence> {
    try {
      const supabase = this.supabaseService.getClient();

      // 1. Crear la secuencia
      const { data: sequence, error: sequenceError } = await supabase
        .from('follow_up_sequences')
        .insert({
          organization_id: organizationId,
          name: dto.name,
          description: dto.description,
          enabled: dto.enabled ?? true,
          trigger_type: dto.trigger_type,
          trigger_config: dto.trigger_config,
          strategy: dto.strategy ?? 'moderate',
          conditions: dto.conditions ?? {},
        })
        .select()
        .single();

      if (sequenceError) {
        throw new BadRequestException(`Error creating sequence: ${sequenceError.message}`);
      }

      // 2. Crear los mensajes
      if (dto.messages && dto.messages.length > 0) {
        const messagesData = dto.messages.map(msg => ({
          sequence_id: sequence.id,
          step_order: msg.step_order,
          delay_amount: msg.delay_amount,
          delay_unit: msg.delay_unit,
          message_template: msg.message_template,
          available_variables: msg.available_variables ?? [],
          send_conditions: msg.send_conditions ?? {},
        }));

        const { error: messagesError } = await supabase
          .from('follow_up_messages')
          .insert(messagesData);

        if (messagesError) {
          // Rollback: eliminar la secuencia
          await supabase.from('follow_up_sequences').delete().eq('id', sequence.id);
          throw new BadRequestException(`Error creating messages: ${messagesError.message}`);
        }
      }

      this.logger.log(`Created follow-up sequence: ${sequence.id} - ${sequence.name}`);
      return sequence;
    } catch (error) {
      this.logger.error(`Error creating sequence: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtener todas las secuencias de una organización
   */
  async findAllSequences(organizationId: string): Promise<FollowUpSequence[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('follow_up_sequences')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Error fetching sequences: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener una secuencia con sus mensajes
   */
  async findOneSequence(id: string, organizationId: string): Promise<any> {
    const supabase = this.supabaseService.getClient();

    // Obtener la secuencia
    const { data: sequence, error: seqError } = await supabase
      .from('follow_up_sequences')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (seqError || !sequence) {
      throw new NotFoundException(`Sequence not found`);
    }

    // Obtener los mensajes
    const { data: messages, error: msgError } = await supabase
      .from('follow_up_messages')
      .select('*')
      .eq('sequence_id', id)
      .order('step_order', { ascending: true });

    if (msgError) {
      throw new BadRequestException(`Error fetching messages: ${msgError.message}`);
    }

    return {
      ...sequence,
      messages: messages || [],
    };
  }

  /**
   * Actualizar una secuencia
   */
  async updateSequence(id: string, organizationId: string, dto: UpdateSequenceDto): Promise<FollowUpSequence> {
    try {
      const supabase = this.supabaseService.getClient();

      // Verificar que existe
      await this.findOneSequence(id, organizationId);

      // Actualizar la secuencia
      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.enabled !== undefined) updateData.enabled = dto.enabled;
      if (dto.trigger_type !== undefined) updateData.trigger_type = dto.trigger_type;
      if (dto.trigger_config !== undefined) updateData.trigger_config = dto.trigger_config;
      if (dto.strategy !== undefined) updateData.strategy = dto.strategy;
      if (dto.conditions !== undefined) updateData.conditions = dto.conditions;

      const { data: sequence, error } = await supabase
        .from('follow_up_sequences')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw new BadRequestException(`Error updating sequence: ${error.message}`);
      }

      // Si hay mensajes en el DTO, actualizarlos (simplificado: eliminar y recrear)
      if (dto.messages && dto.messages.length > 0) {
        // Eliminar mensajes anteriores
        await supabase.from('follow_up_messages').delete().eq('sequence_id', id);

        // Crear nuevos mensajes
        const messagesData = dto.messages.map(msg => ({
          sequence_id: id,
          step_order: msg.step_order,
          delay_amount: msg.delay_amount,
          delay_unit: msg.delay_unit,
          message_template: msg.message_template,
          available_variables: msg.available_variables ?? [],
          send_conditions: msg.send_conditions ?? {},
        }));

        await supabase.from('follow_up_messages').insert(messagesData);
      }

      this.logger.log(`Updated follow-up sequence: ${id}`);
      return sequence;
    } catch (error) {
      this.logger.error(`Error updating sequence: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Eliminar una secuencia
   */
  async removeSequence(id: string, organizationId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Verificar que existe
    await this.findOneSequence(id, organizationId);

    const { error } = await supabase
      .from('follow_up_sequences')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new BadRequestException(`Error deleting sequence: ${error.message}`);
    }

    this.logger.log(`Deleted follow-up sequence: ${id}`);
  }

  // =====================================================
  // EJECUCIÓN DE SEGUIMIENTOS
  // =====================================================

  /**
   * Iniciar una nueva ejecución de seguimiento
   */
  async startExecution(organizationId: string, dto: StartExecutionDto): Promise<FollowUpExecution> {
    try {
      const supabase = this.supabaseService.getClient();

      // Verificar que la secuencia existe y está habilitada
      const { data: sequence, error: seqError } = await supabase
        .from('follow_up_sequences')
        .select('*')
        .eq('id', dto.sequence_id)
        .eq('organization_id', organizationId)
        .eq('enabled', true)
        .single();

      if (seqError || !sequence) {
        throw new NotFoundException(`Sequence not found or not enabled`);
      }

      // Obtener el primer mensaje
      const { data: firstMessage, error: msgError } = await supabase
        .from('follow_up_messages')
        .select('*')
        .eq('sequence_id', dto.sequence_id)
        .eq('step_order', 1)
        .single();

      if (msgError || !firstMessage) {
        throw new NotFoundException(`No messages found for this sequence`);
      }

      // Calcular cuándo enviar el primer mensaje
      const nextScheduledAt = this.calculateNextSchedule(firstMessage.delay_amount, firstMessage.delay_unit);

      // Crear la ejecución
      const { data: execution, error: execError } = await supabase
        .from('follow_up_executions')
        .insert({
          sequence_id: dto.sequence_id,
          organization_id: organizationId,
          contact_phone: dto.contact_phone,
          contact_name: dto.contact_name,
          status: 'active',
          current_step: 0,
          next_scheduled_at: nextScheduledAt.toISOString(),
          conversation_context: dto.conversation_context,
          trigger_data: dto.trigger_data,
          converted: false,
          total_messages_sent: 0,
        })
        .select()
        .single();

      if (execError) {
        throw new BadRequestException(`Error creating execution: ${execError.message}`);
      }

      this.logger.log(`Started follow-up execution: ${execution.id} for ${dto.contact_phone}`);
      return execution;
    } catch (error) {
      this.logger.error(`Error starting execution: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar ejecuciones pendientes (llamado por cron)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingExecutions(): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      // Obtener ejecuciones pendientes
      const { data: pendingExecutions, error } = await supabase
        .rpc('get_pending_executions')
        .lte('next_scheduled_at', new Date().toISOString());

      if (error) {
        this.logger.error(`Error fetching pending executions: ${error.message}`);
        return;
      }

      if (!pendingExecutions || pendingExecutions.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingExecutions.length} pending executions`);

      for (const execution of pendingExecutions) {
        try {
          await this.sendFollowUpMessage(execution);
        } catch (err) {
          this.logger.error(`Error processing execution ${execution.id}: ${err.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in processPendingExecutions: ${error.message}`, error.stack);
    }
  }

  /**
   * Enviar un mensaje de seguimiento
   */
  private async sendFollowUpMessage(execution: any): Promise<void> {
    const supabase = this.supabaseService.getClient();

    try {
      const nextStep = execution.current_step + 1;

      // Obtener el mensaje a enviar
      const { data: message, error: msgError } = await supabase
        .from('follow_up_messages')
        .select('*')
        .eq('sequence_id', execution.sequence_id)
        .eq('step_order', nextStep)
        .single();

      if (msgError || !message) {
        // No hay más mensajes, marcar como completada
        await supabase
          .from('follow_up_executions')
          .update({
            status: 'abandoned',
            completed_at: new Date().toISOString(),
          })
          .eq('id', execution.id);

        this.logger.log(`Execution ${execution.id} completed (no more messages)`);
        return;
      }

      // Reemplazar variables en el mensaje
      const messageText = this.replaceVariables(message.message_template, execution.conversation_context);

      // Enviar el mensaje por WhatsApp
      const whatsappMessageId = await this.sendWhatsAppMessage(
        execution.contact_phone,
        messageText,
        execution.organization_id,
      );

      // Crear log del mensaje
      await supabase.from('follow_up_message_logs').insert({
        execution_id: execution.id,
        message_id: message.id,
        step_number: nextStep,
        message_sent: messageText,
        delivery_status: 'sent',
        whatsapp_message_id: whatsappMessageId,
      });

      // Verificar si hay más mensajes
      const { data: nextMessage } = await supabase
        .from('follow_up_messages')
        .select('*')
        .eq('sequence_id', execution.sequence_id)
        .eq('step_order', nextStep + 1)
        .single();

      if (nextMessage) {
        // Calcular cuándo enviar el próximo mensaje
        const nextScheduledAt = this.calculateNextSchedule(nextMessage.delay_amount, nextMessage.delay_unit);

        // Actualizar la ejecución
        await supabase
          .from('follow_up_executions')
          .update({
            current_step: nextStep,
            next_scheduled_at: nextScheduledAt.toISOString(),
            last_message_sent_at: new Date().toISOString(),
            total_messages_sent: execution.total_messages_sent + 1,
          })
          .eq('id', execution.id);

        this.logger.log(`Sent message ${nextStep} for execution ${execution.id}, next at ${nextScheduledAt}`);
      } else {
        // Era el último mensaje, marcar como completada
        await supabase
          .from('follow_up_executions')
          .update({
            current_step: nextStep,
            status: 'completed',
            completed_at: new Date().toISOString(),
            last_message_sent_at: new Date().toISOString(),
            total_messages_sent: execution.total_messages_sent + 1,
          })
          .eq('id', execution.id);

        this.logger.log(`Execution ${execution.id} completed (last message sent)`);
      }
    } catch (error) {
      this.logger.error(`Error sending follow-up message: ${error.message}`, error.stack);

      // Registrar el error en el log
      await supabase.from('follow_up_message_logs').insert({
        execution_id: execution.id,
        message_id: execution.next_message_id,
        step_number: execution.current_step + 1,
        message_sent: '',
        delivery_status: 'failed',
        error_message: error.message,
      });

      throw error;
    }
  }

  /**
   * Enviar mensaje por WhatsApp (integración con Evolution API)
   */
  private async sendWhatsAppMessage(phone: string, message: string, organizationId: string): Promise<string> {
    // TODO: Integrar con Evolution API o el servicio de WhatsApp que uses
    // Por ahora, retornar un ID simulado
    this.logger.log(`[TODO] Sending WhatsApp message to ${phone}: ${message}`);
    return `msg_${Date.now()}`;
  }

  /**
   * Cancelar una ejecución
   */
  async cancelExecution(executionId: string, organizationId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('follow_up_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new BadRequestException(`Error cancelling execution: ${error.message}`);
    }

    this.logger.log(`Cancelled execution: ${executionId}`);
  }

  /**
   * Marcar una ejecución como convertida (cliente respondió)
   */
  async markAsConverted(executionId: string, organizationId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Actualizar la ejecución
    const { error: execError } = await supabase
      .from('follow_up_executions')
      .update({
        status: 'completed',
        converted: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', executionId)
      .eq('organization_id', organizationId);

    if (execError) {
      throw new BadRequestException(`Error marking as converted: ${execError.message}`);
    }

    // Obtener la secuencia para actualizar estadísticas
    const { data: execution } = await supabase
      .from('follow_up_executions')
      .select('sequence_id')
      .eq('id', executionId)
      .single();

    if (execution) {
      // Incrementar contador de conversiones
      await supabase
        .from('follow_up_sequences')
        .update({
          successful_conversions: supabase.rpc('increment', { row_id: execution.sequence_id }),
        })
        .eq('id', execution.sequence_id);
    }

    this.logger.log(`Marked execution ${executionId} as converted`);
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  /**
   * Calcular la próxima fecha/hora de envío
   */
  private calculateNextSchedule(amount: number, unit: 'minutes' | 'hours' | 'days'): Date {
    const now = new Date();
    const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };

    return new Date(now.getTime() + amount * multipliers[unit]);
  }

  /**
   * Reemplazar variables en el template del mensaje
   */
  private replaceVariables(template: string, context: any): string {
    let message = template;

    // Reemplazar variables con formato {variable}
    const variableRegex = /\{(\w+)\}/g;
    message = message.replace(variableRegex, (match, varName) => {
      return context[varName] !== undefined ? context[varName] : match;
    });

    return message;
  }

  /**
   * Obtener estadísticas de una secuencia
   */
  async getSequenceStats(sequenceId: string, organizationId: string): Promise<any> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('follow_up_sequences_summary')
      .select('*')
      .eq('id', sequenceId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      throw new BadRequestException(`Error fetching stats: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener todas las ejecuciones de una organización
   */
  async findAllExecutions(organizationId: string, filters?: any): Promise<FollowUpExecution[]> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('follow_up_executions')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.sequence_id) {
      query = query.eq('sequence_id', filters.sequence_id);
    }

    const { data, error } = await query.order('started_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Error fetching executions: ${error.message}`);
    }

    return data || [];
  }
}
