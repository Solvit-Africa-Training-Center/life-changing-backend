// src/modules/beneficiaries/controllers/emergency-contacts.controller.ts
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
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { EmergencyContactsService } from '../services/emergency-contacts.service';
import { CreateEmergencyContactDto, UpdateEmergencyContactDto } from '../dto/create-emergency-contact.dto';
import { UserType } from '../../../config/constants';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';

@ApiTags('beneficiaries')
@Controller('beneficiaries/emergency-contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmergencyContactsController {
  constructor(private readonly contactsService: EmergencyContactsService) {}

  @Post()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Add emergency contact' })
  async addContact(@Req() req, @Body() createContactDto: CreateEmergencyContactDto) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.contactsService.createContact(beneficiary.id, createContactDto);
  }

  @Get()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get emergency contacts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getContacts(
    @Req() req,
    @Query() paginationParams: PaginationParams
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.contactsService.getBeneficiaryContacts(beneficiary.id, paginationParams);
  }

  @Get('primary')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get primary emergency contact' })
  async getPrimaryContact(@Req() req) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.contactsService.getPrimaryContact(beneficiary.id);
  }

  @Put(':id/set-primary')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Set contact as primary' })
  async setPrimaryContact(@Param('id') id: string) {
    return this.contactsService.setPrimaryContact(id);
  }

  @Delete(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete emergency contact' })
  async deleteContact(@Param('id') id: string) {
    await this.contactsService.delete(id);
  }

  private async getBeneficiaryFromRequest(req: any) {
    // Implementation similar to other controllers
  }
}