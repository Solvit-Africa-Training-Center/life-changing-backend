// src/common/pipes/parse-program-dto.pipe.ts
import { PipeTransform, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProgramDTO } from '../../modules/programs/dto/create-program.dto';

@Injectable()
export class ParseProgramDtoPipe implements PipeTransform {
  private readonly logger = new Logger(ParseProgramDtoPipe.name);

  async transform(value: any) {
    this.logger.log('🔍 ========== PIPE STARTING ==========');
    this.logger.log('📥 RAW INPUT TYPE: ' + typeof value);
    this.logger.log('📥 RAW INPUT: ' + JSON.stringify(value, null, 2));
    
    try {
      const parsedValue = { ...value };
      
      // Parse name (JSON string to object)
      if (parsedValue.name) {
        this.logger.log(`🔄 Parsing 'name' - Type: ${typeof parsedValue.name}`);
        if (typeof parsedValue.name === 'string') {
          try {
            parsedValue.name = JSON.parse(parsedValue.name);
            this.logger.log('✅ name parsed successfully');
          } catch (e) {
            this.logger.error('❌ Failed to parse name: ' + e.message);
            throw new BadRequestException('Invalid JSON format for name field');
          }
        }
      }
      
      // Parse description (JSON string to object)
      if (parsedValue.description) {
        this.logger.log(`🔄 Parsing 'description' - Type: ${typeof parsedValue.description}`);
        if (typeof parsedValue.description === 'string') {
          try {
            parsedValue.description = JSON.parse(parsedValue.description);
            this.logger.log('✅ description parsed successfully');
          } catch (e) {
            this.logger.error('❌ Failed to parse description: ' + e.message);
            throw new BadRequestException('Invalid JSON format for description field');
          }
        }
      }
      
      // Parse sdgAlignment (comma-separated or JSON array to array)
      if (parsedValue.sdgAlignment) {
        this.logger.log(`🔄 Parsing 'sdgAlignment' - Type: ${typeof parsedValue.sdgAlignment}, Value: ${parsedValue.sdgAlignment}`);
        if (typeof parsedValue.sdgAlignment === 'string') {
          // Try JSON parse first
          try {
            parsedValue.sdgAlignment = JSON.parse(parsedValue.sdgAlignment);
          } catch {
            // If JSON parse fails, split by comma
            parsedValue.sdgAlignment = parsedValue.sdgAlignment
              .split(',')
              .map((n: string) => parseInt(n.trim(), 10))
              .filter((n: number) => !isNaN(n));
          }
          this.logger.log('✅ sdgAlignment parsed: ' + JSON.stringify(parsedValue.sdgAlignment));
        }
      }
      
      // Parse kpiTargets (JSON string to object)
      if (parsedValue.kpiTargets) {
        this.logger.log(`🔄 Parsing 'kpiTargets' - Type: ${typeof parsedValue.kpiTargets}`);
        if (typeof parsedValue.kpiTargets === 'string') {
          try {
            parsedValue.kpiTargets = JSON.parse(parsedValue.kpiTargets);
            this.logger.log('✅ kpiTargets parsed successfully');
          } catch (e) {
            this.logger.error('❌ Failed to parse kpiTargets: ' + e.message);
            throw new BadRequestException('Invalid JSON format for kpiTargets field');
          }
        }
      }
      
      // Parse projects (JSON array to array)
      if (parsedValue.projects) {
        this.logger.log(`🔄 Parsing 'projects' - Type: ${typeof parsedValue.projects}, Value: ${parsedValue.projects}`);
        if (typeof parsedValue.projects === 'string') {
          try {
            const parsed = JSON.parse(parsedValue.projects);
            // If it's an empty object {} or empty array [], convert to []
            if (typeof parsed === 'object' && Object.keys(parsed).length === 0 && !Array.isArray(parsed)) {
              parsedValue.projects = [];
            } else if (Array.isArray(parsed)) {
              parsedValue.projects = parsed;
            } else {
              parsedValue.projects = [];
            }
            this.logger.log('✅ projects parsed: ' + JSON.stringify(parsedValue.projects));
          } catch (e) {
            this.logger.warn('⚠️ Failed to parse projects, defaulting to empty array');
            parsedValue.projects = [];
          }
        } else if (!Array.isArray(parsedValue.projects)) {
          parsedValue.projects = [];
        }
      } else {
        parsedValue.projects = [];
      }
      
      // Convert budget to number
      if (parsedValue.budget) {
        parsedValue.budget = typeof parsedValue.budget === 'string' 
          ? parseFloat(parsedValue.budget) 
          : parsedValue.budget;
      }
      
      this.logger.log('🔄 ========== PARSED VALUE ==========');
      this.logger.log(JSON.stringify(parsedValue, null, 2));
      
      // Transform to class instance
      const programDto = plainToClass(CreateProgramDTO, parsedValue, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
      });
      
      this.logger.log('🎯 ========== DTO INSTANCE ==========');
      this.logger.log(JSON.stringify(programDto, null, 2));
      
      // Validate
      const errors = await validate(programDto, {
        whitelist: true,
        forbidNonWhitelisted: false,
      });
      
      if (errors.length > 0) {
        this.logger.error('❌ ========== VALIDATION ERRORS ==========');
        errors.forEach(error => {
          this.logger.error(`Field: ${error.property}`);
          this.logger.error(`Constraints: ${JSON.stringify(error.constraints)}`);
          if (error.children && error.children.length > 0) {
            this.logger.error(`Children: ${JSON.stringify(error.children)}`);
          }
        });
        
        const messages = this.flattenErrors(errors);
        throw new BadRequestException(messages);
      }
      
      this.logger.log('✅ ========== VALIDATION PASSED ==========');
      return programDto;
      
    } catch (error) {
      this.logger.error('❌ ========== PIPE ERROR ==========');
      this.logger.error(error.message);
      this.logger.error(error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Invalid request body: ${error.message}`);
    }
  }

  private flattenErrors(errors: any[]): string[] {
    const messages: string[] = [];
    
    errors.forEach(error => {
      if (error.constraints) {
        //messages.push(...Object.values(error.constraints));
      }
      if (error.children && error.children.length > 0) {
        messages.push(...this.flattenErrors(error.children));
      }
    });
    
    return messages;
  }
}