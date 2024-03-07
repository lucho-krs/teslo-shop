import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { Product, ProductImage } from './entities';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository( Product )
    private readonly productRepository: Repository<Product>,
    
    @InjectRepository( ProductImage )
    private readonly productImageRepository: Repository<ProductImage>
  ) {} 

  async create( createProductDto: CreateProductDto ) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const product = await this.productRepository.create({
        ...createProductDto, 
        images: images.map( image => this.productImageRepository.create({ url: image }) )
      })
      await this.productRepository.save( product );

      return { ...product, images };
    } catch (error) {
      this.handleDBExceptions( error );
    }
  }

  async findAll( paginationDto: PaginationDto ) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });

    return products.map( ({ images, ...rest }) => ({
      ...rest,
      images: images.map( img => img.url )
    }))
  }

  async findOne( term: string ) {
    let product: Product;
    
    if ( isUUID( term ) ) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const query = this.productRepository.createQueryBuilder('prod');
      product = await query
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(), 
          slug: term.toLowerCase()
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    if ( !product ) {
      throw new  NotFoundException(`Product whit id ${ term } not found`);
    }

    return product;
  }

  async findOnePlain( term: string ) {
    const { images = [], ...rest } = await this.findOne( term );
    return {
      ...rest,
      images: images.map( image => image.url )
    }
  }

  async update( id: string, updateProductDto: UpdateProductDto ) {
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
      images: []
    });

    if ( !product ) {
      throw new NotFoundException(`Product with id ${ id } not found`);
    }

    try {
      return await this.productRepository.save( product );
    } catch (error) {
      this.handleDBExceptions( error );
    }

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
