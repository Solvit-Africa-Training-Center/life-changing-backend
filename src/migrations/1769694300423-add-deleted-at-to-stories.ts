import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToStories1769694300423 implements MigrationInterface {
    name = 'AddDeletedAtToStories1769694300423'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "deleted_at"`);
    }

}
