import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('webhook_events')
@Index(['provider', 'status'])
@Index(['createdAt'])
@Index(['processedAt'])
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider: string; // 'stripe', 'africastalking', 'mtn_momo', 'airtel_money'

  @Column({ name: 'event_type' })
  eventType: string; // 'payment_intent.succeeded', 'ussd.session', etc.

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ name: 'processing_started_at', type: 'timestamp', nullable: true })
  processingStartedAt: Date;

  @Column({ name: 'signature', type: 'text', nullable: true })
  signature: string; // For signature verification

  @Column({ name: 'webhook_id', nullable: true })
  webhookId: string; // External webhook ID

  @Column({ name: 'attempt_id', nullable: true })
  attemptId: string; // External attempt ID
}
