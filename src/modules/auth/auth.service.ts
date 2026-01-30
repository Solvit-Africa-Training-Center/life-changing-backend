import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserType } from '../../config/constants';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Beneficiary)
        private readonly beneficiaryRepo: Repository<Beneficiary>,
        private readonly jwtService: JwtService
    ) { }

    async login(loginDto: LoginDto) {
        const user = await this.userRepo.createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email: loginDto.email })
            .getOne();

        if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, role: user.userType };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.userRepo.findOne({
            where: [{ email: registerDto.email }, { phone: registerDto.phone }]
        });

        if (existingUser) {
            throw new ConflictException('User with this email or phone already exists');
        }

        // 1. Create User
        const user = this.userRepo.create({
            email: registerDto.email,
            phone: registerDto.phone,
            password: registerDto.password, // hashed via BeforeInsert in entity
            userType: UserType.BENEFICIARY,
            isActive: true,
            isVerified: true
        });

        const savedUser = await this.userRepo.save(user);

        // 2. Create Beneficiary
        const beneficiary = this.beneficiaryRepo.create({
            user: savedUser,
            fullName: `${registerDto.firstName} ${registerDto.lastName}`,
            dateOfBirth: new Date(registerDto.dateOfBirth),
            businessType: registerDto.businessType,
            startCapital: registerDto.startCapital,
            currentCapital: registerDto.startCapital,
            enrollmentDate: new Date(),
            location: {
                district: registerDto.district,
                sector: 'Default',
                cell: 'Default',
                village: 'Default'
            }
        });

        await this.beneficiaryRepo.save(beneficiary);

        return {
            message: 'Beneficiary registered successfully',
            userId: savedUser.id
        };
    }
}
