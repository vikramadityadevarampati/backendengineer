import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1692000000000 implements MigrationInterface {
    name = 'CreateInitialTables1692000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create books table
        await queryRunner.query(`
            CREATE TABLE "books" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "title" varchar NOT NULL,
                "author" varchar NOT NULL,
                "isbn" varchar NOT NULL,
                "publishedYear" integer,
                "description" text,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_books_isbn" UNIQUE ("isbn")
            )
        `);

        // Create reviews table
        await queryRunner.query(`
            CREATE TABLE "reviews" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "rating" integer NOT NULL,
                "comment" text NOT NULL,
                "reviewerName" varchar,
                "bookId" integer NOT NULL,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "FK_reviews_bookId" FOREIGN KEY ("bookId") REFERENCES "books" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Create indexes for performance optimization
        
        // Composite index on books for common queries
        await queryRunner.query(`
            CREATE INDEX "IDX_books_title_author" ON "books" ("title", "author")
        `);

        // Index on reviews.bookId for efficient book review lookups (as required)
        await queryRunner.query(`
            CREATE INDEX "IDX_reviews_bookId" ON "reviews" ("bookId")
        `);

        // Additional index on reviews.rating for rating-based queries
        await queryRunner.query(`
            CREATE INDEX "IDX_reviews_rating" ON "reviews" ("rating")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_reviews_rating"`);
        await queryRunner.query(`DROP INDEX "IDX_reviews_bookId"`);
        await queryRunner.query(`DROP INDEX "IDX_books_title_author"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "books"`);
    }
}