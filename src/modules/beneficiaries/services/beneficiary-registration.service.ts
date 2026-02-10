// src/modules/beneficiaries/services/beneficiary-registration.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Beneficiary } from '../entities/beneficiary.entity';
import { User } from '../../users/entities/user.entity';
import { Program } from '../../programs/entities/program.entity';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { UserType, BeneficiaryStatus, TrackingFrequency, ProgramStatus } from '../../../config/constants';

@Injectable()
export class BeneficiaryRegistrationService {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Program)
    private programsRepository: Repository<Program>,
  ) {}

  async createBeneficiary(userId: string, createBeneficiaryDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    // 1. Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Check if user already has a beneficiary profile
    const existingBeneficiary = await this.beneficiariesRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingBeneficiary) {
      throw new ConflictException('User already has a beneficiary profile');
    }

    // 3. Validate date of birth
    this.validateDateOfBirth(createBeneficiaryDto.dateOfBirth);

    // 4. Handle program (optional)
    const { program, enrollmentDate, initialStatus } = await this.handleProgramAssignment(
      createBeneficiaryDto.programId,
      createBeneficiaryDto.enrollmentDate
    );

    // 5. Update user type
    await this.updateUserType(user);

    // 6. Create beneficiary profile
    const beneficiary = await this.createBeneficiaryProfile(
      user,
      program,
      createBeneficiaryDto,
      initialStatus,
      enrollmentDate
    );

    // 7. Update program funds allocated
    if (program && createBeneficiaryDto.startCapital > 0) {
      await this.updateProgramFundsAllocated(program.id, createBeneficiaryDto.startCapital);
    }

    return plainToInstance(Beneficiary, beneficiary);
  }

  private validateDateOfBirth(dateOfBirthString: string): void {
    const dateOfBirth = new Date(dateOfBirthString);
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    if (age < 18) {
      throw new BadRequestException('Beneficiary must be at least 18 years old');
    }
  }

  private async handleProgramAssignment(programId?: string, enrollmentDateString?: string): Promise<{
    program: Program | null;
    enrollmentDate: Date | null;
    initialStatus: BeneficiaryStatus;
  }> {
    let program: Program | null = null;
    let enrollmentDate: Date | null = null;
    let initialStatus = BeneficiaryStatus.PENDING;

    if (programId) {
      program = await this.programsRepository.findOne({
        where: {
          id: programId,
          status: In([ProgramStatus.ACTIVE, ProgramStatus.PLANNING])
        },
      });

      if (!program) {
        throw new NotFoundException('Program not found or not available for enrollment');
      }

      enrollmentDate = enrollmentDateString ? new Date(enrollmentDateString) : new Date();

      if (enrollmentDate > new Date()) {
        throw new BadRequestException('Enrollment date cannot be in the future');
      }

      if (program.endDate && program.endDate < new Date() && program.status === ProgramStatus.ACTIVE) {
        program.status = ProgramStatus.COMPLETED;
        await this.programsRepository.save(program);
        throw new BadRequestException('This program has ended. Cannot enroll new beneficiaries.');
      }

      initialStatus = program.status === ProgramStatus.PLANNING
        ? BeneficiaryStatus.WAITING
        : BeneficiaryStatus.ACTIVE;
    }

    return { program, enrollmentDate, initialStatus };
  }

  private async updateUserType(user: User): Promise<void> {
    if (user.userType !== UserType.BENEFICIARY) {
      user.userType = UserType.BENEFICIARY;
      await this.usersRepository.save(user);
    }
  }

  private async createBeneficiaryProfile(
    user: User,
    program: Program | null,
    dto: CreateBeneficiaryDto,
    status: BeneficiaryStatus,
    enrollmentDate: Date | null
  ): Promise<Beneficiary> {
    const beneficiary = this.beneficiariesRepository.create({
      user,
      program,
      dateOfBirth: new Date(dto.dateOfBirth),
      location: dto.location,
      status,
      enrollmentDate,
      startCapital: dto.startCapital || 0,
      currentCapital: dto.startCapital || 0,
      businessType: dto.businessType,
      trackingFrequency: dto.trackingFrequency || TrackingFrequency.WEEKLY,
      requiresSpecialAttention: dto.requiresSpecialAttention || false,
      profileCompletion: this.calculateProfileCompletion(dto),
    });

    return await this.beneficiariesRepository.save(beneficiary);
  }

  private calculateProfileCompletion(dto: CreateBeneficiaryDto): number {
    const requiredFields = [
      'dateOfBirth',
      'location',
      'startCapital',
      'businessType',
      'trackingFrequency',
    ];

    const totalFields = requiredFields.length;
    let completedFields = 0;

    if (dto.dateOfBirth) completedFields++;
    if (dto.location && dto.location.district && dto.location.sector && dto.location.cell && dto.location.village) completedFields++;
    if (dto.startCapital !== undefined && dto.startCapital !== null) completedFields++;
    if (dto.businessType) completedFields++;
    if (dto.trackingFrequency) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  private async updateProgramFundsAllocated(programId: string, amount: number): Promise<void> {
    await this.programsRepository.createQueryBuilder()
      .update(Program)
      .set({
        fundsAllocated: () => `funds_allocated + ${amount}`,
      })
      .where('id = :id', { id: programId })
      .execute();
  }
}