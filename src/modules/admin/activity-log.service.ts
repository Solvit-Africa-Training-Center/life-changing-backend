import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async logActivity(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
    ipAddress: string = 'unknown',
    userAgent?: string,
    location?: { country: string; region: string; city: string },
    description?: string, 
  ): Promise<ActivityLog> {

    const activityLog = this.activityLogRepository.create({
        user: userId ? ({ id: userId } as any) : undefined,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        changes: this.calculateChanges(oldValues, newValues),
        ipAddress,
        userAgent,
        location,
        description
    } as Partial<ActivityLog>);

    return await this.activityLogRepository.save(activityLog);
  }

  async logActivityFromRequest(
    req: Request,
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
  ): Promise<ActivityLog> {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent');
    
    // You could add geolocation service here
    const location = await this.getLocationFromIP(ipAddress);

    return this.logActivity(
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      location,
    );
  }

  private calculateChanges(
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
  ): Record<string, { old: any; new: any }> | null {
    if (!oldValues || !newValues) return null;

    const changes: Record<string, { old: any; new: any }> = {};
    
    // Compare old and new values
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    
    for (const key of allKeys) {
      const oldVal = oldValues[key];
      const newVal = newValues[key];
      
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[key] = {
          old: oldVal,
          new: newVal,
        };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  private async getLocationFromIP(ipAddress: string): Promise<{ country: string; region: string; city: string } | undefined> {
    if (ipAddress === 'unknown' || ipAddress === '127.0.0.1') {
      return undefined;
    }

    // In production, integrate with a geolocation service like ipapi, ipstack, etc.
    try {
      // Example: Using a free geolocation service
      // const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      // const data = await response.json();
      
      // return {
      //   country: data.country_name,
      //   region: data.region,
      //   city: data.city,
      // };

      return undefined; // Return undefined for now
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return undefined;
    }
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    return await this.activityLogRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getEntityActivity(entityType: string, entityId: string): Promise<ActivityLog[]> {
    return await this.activityLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async searchActivities(
    userId?: string,
    action?: string,
    entityType?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ActivityLog[]> {
    const query = this.activityLogRepository.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user');

    if (userId) {
      query.andWhere('activity.user.id = :userId', { userId });
    }

    if (action) {
      query.andWhere('activity.action = :action', { action });
    }

    if (entityType) {
      query.andWhere('activity.entityType = :entityType', { entityType });
    }

    if (startDate) {
      query.andWhere('activity.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('activity.createdAt <= :endDate', { endDate });
    }

    query.orderBy('activity.createdAt', 'DESC');

    return await query.getMany();
  }
}