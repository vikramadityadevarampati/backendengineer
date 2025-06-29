import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const validateRequest = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToClass(dtoClass, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const errorMessages = errors.map(error => {
          return Object.values(error.constraints || {}).join(', ');
        }).join('; ');

        res.status(400).json({
          error: 'Validation failed',
          details: errorMessages
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Validation process failed'
      });
    }
  };
};