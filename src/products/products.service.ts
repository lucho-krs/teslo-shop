import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository( Product )
    private readonly productRepository: Repository<Product>
  ) {} 

  async create( createProductDto: CreateProductDto ) {
    try {
      const product = await this.productRepository.create( createProductDto );
      await this.productRepository.save( product );

      return product;
    } catch (error) {
      this.handleDBExceptions( error );
    }
  }

  async findAll( paginationDto: PaginationDto ) {
    const { limit = 10, offset = 0 } = paginationDto;

    return await this.productRepository.find({
      take: limit,
      skip: offset
    });
  }

  async findOne( term: string ) {
    let product: Product;
    
    if ( isUUID( term ) ) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      product = await this.productRepository.findOneBy({ slug: term });
    }

    if ( !product ) {
      throw new  NotFoundException(`Product whit id ${ term } not found`);
    }
    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove( id: string ) {
    const { affected } = await this.productRepository.delete( id );
    if ( affected === 0) {
      throw new BadRequestException(`Product whit id "${ id }" not found`)
    }
     
    return;
  }

  private handleDBExceptions( error: any ) {
    if ( error.code === '23505' ) {
      throw new BadRequestException( error.detail );
    }

    this.logger.error( error );
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
