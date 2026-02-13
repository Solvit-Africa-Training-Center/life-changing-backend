import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ForbiddenException,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentBeneficiary } from '../../../common/decorators/current-beneficiary.decorator';
import { EmergencyContactsService } from '../services/emergency-contacts.service';
import { CreateEmergencyContactDto, UpdateEmergencyContactDto } from '../dto/create-emergency-contact.dto';
import { UserType } from '../../../config/constants';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { Beneficiary } from '../entities/beneficiary.entity';
import { EmergencyContact } from '../entities/emergency-contact.entity';
import { BeneficiaryServiceInterceptor } from 'src/common/interceptors/beneficiary-service.interceptor';

@ApiTags('beneficiaries')
@Controller('beneficiaries/emergency-contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(BeneficiaryServiceInterceptor)
export class EmergencyContactsController {
  constructor(private readonly contactsService: EmergencyContactsService) {}

  @Post()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Add emergency contact' })
  async addContact(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Body() createContactDto: CreateEmergencyContactDto
  ) {
    return this.contactsService.createContact(beneficiary.id, createContactDto);
  }

  @Get()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get emergency contacts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getContacts(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Query() paginationParams: PaginationParams
  ) {
    return this.contactsService.getBeneficiaryContacts(beneficiary.id, paginationParams);
  }

  @Get('primary')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get primary emergency contact' })
  async getPrimaryContact(@CurrentBeneficiary() beneficiary: Beneficiary) {
    return this.contactsService.getPrimaryContact(beneficiary.id);
  }

  @Put(':id/set-primary')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Set contact as primary' })
  async setPrimaryContact(
    @Param('id') id: string,
    @CurrentBeneficiary() beneficiary: Beneficiary
  ) {
    await this.checkContactOwnership(id, beneficiary.id);
    return this.contactsService.setPrimaryContact(id);
  }

  @Put(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Update emergency contact' })
  async updateContact(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateEmergencyContactDto,
    @CurrentBeneficiary() beneficiary: Beneficiary
  ) {
    await this.checkContactOwnership(id, beneficiary.id);
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete emergency contact' })
  async deleteContact(
    @Param('id') id: string,
    @CurrentBeneficiary() beneficiary: Beneficiary
  ) {
    await this.checkContactOwnership(id, beneficiary.id);
    await this.contactsService.delete(id);
  }

  @Get(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get emergency contact by ID' })
  async getContactById(
    @Param('id') id: string,
    @CurrentBeneficiary() beneficiary: Beneficiary
  ) {
    await this.checkContactOwnership(id, beneficiary.id);
    return this.contactsService.findOne(id, ['beneficiary']);
  }

  private async checkContactOwnership(contactId: string, beneficiaryId: string): Promise<void> {
    const contact = await this.contactsService.findOne(contactId, ['beneficiary']);
    
    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }
    
    if (contact.beneficiary.id !== beneficiaryId) {
      throw new ForbiddenException('You do not have permission to access this contact');
    }
  }
}