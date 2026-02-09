import { PartialType } from '@nestjs/mapped-types';
import { CreateProgramDTO } from './create-program.dto';

export class UpdateProgramDTO extends PartialType(CreateProgramDTO) {}
