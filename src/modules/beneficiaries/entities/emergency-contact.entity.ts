import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { Beneficiary } from './beneficiary.entity';

@Entity('emergency_contacts')
export class EmergencyContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, (beneficiary) => beneficiary.emergencyContacts)
  beneficiary: Beneficiary;

  @Column()
  name: string;

  @Column()
  relationship: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  alternatePhone: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ default: false })
  isPrimary: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}