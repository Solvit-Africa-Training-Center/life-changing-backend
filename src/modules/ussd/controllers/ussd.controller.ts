import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UssdRequestDto } from '../dto/ussd-request.dto';
import { Response } from 'express';
import { UssdService } from '../services/ussd.service';

@ApiTags('ussd')
@Controller('ussd')
export class UssdController {
    private readonly logger = new Logger(UssdController.name);

    constructor(private readonly ussdService: UssdService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Africa\'s Talking USSD requests' })
    @ApiResponse({
        status: 200,
        description: 'USSD response text',
        type: String,
    })
    async handleUssd(@Body() body: UssdRequestDto, @Res() res) {
  
        this.logger.log(`Received USSD request: ${JSON.stringify(body)}`);

        const ussdRequest: UssdRequestDto = {
            sessionId: body.sessionId,
            serviceCode: body.serviceCode,
            phoneNumber: body.phoneNumber,
            text: body.text || '',
            networkCode: body.networkCode,
        };

        const response = await this.ussdService.handleUssdRequest(ussdRequest);

        // Send plain text response
        res.set('Content-Type', 'text/plain');
        res.send(response);
    }
}