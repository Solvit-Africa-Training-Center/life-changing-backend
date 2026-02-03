// src/modules/beneficiaries/services/emergency-contacts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EmergencyContact } from '../entities/emergency-contact.entity';
import { Beneficiary } from '../entities/beneficiary.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { CreateEmergencyContactDto, UpdateEmergencyContactDto } from '../dto/create-emergency-contact.dto';

@Injectable()
export class EmergencyContactsService extends BaseService<EmergencyContact> {
  constructor(
    @InjectRepository(EmergencyContact)
    private contactsRepository: Repository<EmergencyContact>,
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
  ) {
    super(contactsRepository);
  }

  async createContact(
    beneficiaryId: string,
    createContactDto: CreateEmergencyContactDto
  ): Promise<EmergencyContact> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    // If this is set as primary, unset other primary contacts
    if (createContactDto.isPrimary) {
      await this.contactsRepository.update(
        { beneficiary: { id: beneficiaryId }, isPrimary: true },
        { isPrimary: false }
      );
    }

    const contact = this.contactsRepository.create({
      beneficiary,
      name: createContactDto.name,
      relationship: createContactDto.relationship,
      phone: createContactDto.phone,
      alternatePhone: createContactDto.alternatePhone,
      address: createContactDto.address,
      isPrimary: createContactDto.isPrimary || false,
    });

    return await this.contactsRepository.save(contact);
  }

  async getBeneficiaryContacts(
    beneficiaryId: string,
    paginationParams: PaginationParams
  ): Promise<PaginatedResponse<EmergencyContact>> {
    const where: FindOptionsWhere<EmergencyContact> = { beneficiary: { id: beneficiaryId } };
    return this.paginate(paginationParams, where, ['beneficiary']);
  }

  async setPrimaryContact(contactId: string): Promise<EmergencyContact> {
    const contact = await this.findOne(contactId, ['beneficiary']);
    
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Unset other primary contacts
    await this.contactsRepository.update(
      { beneficiary: { id: contact.beneficiary.id }, isPrimary: true },
      { isPrimary: false }
    );

    // Set this as primary
    contact.isPrimary = true;
    return await this.contactsRepository.save(contact);
  }

  async getPrimaryContact(beneficiaryId: string): Promise<EmergencyContact | null> {
    return this.contactsRepository.findOne({
      where: { beneficiary: { id: beneficiaryId }, isPrimary: true },
    });
  }
}