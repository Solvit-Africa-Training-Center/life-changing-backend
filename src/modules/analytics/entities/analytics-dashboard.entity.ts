import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn 
} from 'typeorm';

@Entity('analytics_dashboards')
export class AnalyticsDashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  widgets: Array<{
    id: string;
    type: 'chart' | 'metric' | 'table' | 'list';
    title: string;
    config: Record<string, any>;
    position: { x: number; y: number; w: number; h: number };
  }>;

  @Column({ type: 'jsonb' })
  filters: {
    dateRange: { start: Date; end: Date };
    programs: string[];
    locations: string[];
    statuses: string[];
  };

  @Column({ default: false })
  isDefault: boolean;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}