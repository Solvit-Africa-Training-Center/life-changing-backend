import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

@Entity('kpi_targets')
export class KpiTarget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  programId: string;

  @Column()
  kpiName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  targetValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentValue: number;

  @Column({ type: 'date' })
  deadline: Date;

  @Column({
    type: 'enum',
    enum: ['on_track', 'at_risk', 'behind', 'achieved'],
    default: 'on_track',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}