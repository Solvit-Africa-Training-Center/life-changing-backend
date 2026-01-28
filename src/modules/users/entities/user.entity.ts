import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UserType, Language } from '../../../config/constants';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string | null; // Make nullable

  @Column({ unique: true })
  phone: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.BENEFICIARY,
  })
  userType: UserType;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.EN,
  })
  language: Language;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string | null; // Allow null

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null; // Allow null

  @Column({ nullable: true })
  resetPasswordToken: string | null; // Allow null

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date | null; // Allow null

  @Column({ nullable: true })
  offlineSyncToken: string | null; // Allow null

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null; // Allow null

  @AfterLoad()
  afterLoad() {
    // Empty method - helps TypeORM with hydration
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  async comparePassword(attempt: string): Promise<boolean> {
    return bcrypt.compare(attempt, this.password);
  }
}
// import { 
//   Entity, 
//   PrimaryGeneratedColumn, 
//   Column, 
//   CreateDateColumn, 
//   UpdateDateColumn,
//   BeforeInsert,
//   BeforeUpdate,
//   AfterLoad
// } from 'typeorm';
// import { Exclude } from 'class-transformer';
// import * as bcrypt from 'bcrypt';
// import { UserType, Language } from '../../../config/constants';

// @Entity('users')
// export class User {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ unique: true, nullable: true })
//   email: string;

//   @Column({ unique: true })
//   phone: string;

//   @Column({ select: false })
//   @Exclude()
//   password: string;

//   @Column({
//     type: 'enum',
//     enum: UserType,
//     default: UserType.BENEFICIARY,
//   })
//   userType: UserType;

//   @Column({
//     type: 'enum',
//     enum: Language,
//     default: Language.EN,
//   })
//   language: Language;

//   @Column({ default: false })
//   isVerified: boolean;

//   @Column({ nullable: true })
//   verificationToken: string;

//   @Column({ type: 'timestamp', nullable: true })
//   verifiedAt: Date;

//   @Column({ nullable: true })
//   resetPasswordToken: string;

//   @Column({ type: 'timestamp', nullable: true })
//   resetPasswordExpires: Date;

//   @Column({ nullable: true })
//   offlineSyncToken: string;

//   @Column({ default: true })
//   isActive: boolean;

//   @CreateDateColumn({ name: 'created_at' })
//   createdAt: Date;

//   @UpdateDateColumn({ name: 'updated_at' })
//   updatedAt: Date;

//   @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
//   lastLoginAt: Date;

//   @AfterLoad()
//   afterLoad() {
//     // Empty method - helps TypeORM with hydration
//   }

//   @BeforeInsert()
//   @BeforeUpdate()
//   async hashPassword() {
//     if (this.password) {
//       const saltRounds = 10;
//       this.password = await bcrypt.hash(this.password, saltRounds);
//     }
//   }

//   async comparePassword(attempt: string): Promise<boolean> {
//     return bcrypt.compare(attempt, this.password);
//   }
// }