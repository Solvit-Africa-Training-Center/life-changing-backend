import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Beneficiary } from './beneficiary.entity';

@Entity('emergency_contacts')
export class EmergencyContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, (beneficiary) => beneficiary.emergencyContacts)
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary;

  @Column()
  name: string;

  @Column()
  relationship: string;

  @Column()
  phone: string;

  @Column({ name: 'alternate_phone', nullable: true })
  alternatePhone: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
