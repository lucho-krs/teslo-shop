import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SeedService {
  constructor(
    private productService: ProductsService,

    @InjectRepository( User )
    private readonly userRepository: Repository<User>
  ) {}

  async runSeed() {
    await this.deleteTables();
    const adminUser = await this.insertUsers();
    await this.insertNewProducts( adminUser );

    return 'SEED EXECUTED';
  }

  private async deleteTables() {
    await this.productService.deleteAllProducts();

    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder
      .delete()
      .where({})
      .execute()
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];

    seedUsers.forEach(user => { 
      users.push( this.userRepository.create( user ) )
    });

    const dbUsers = await this.userRepository.save( seedUsers );
    return dbUsers[0];
  }

  private async insertNewProducts( user: User ) {
    this.productService.deleteAllProducts();

    const products = initialData.products;
    const insertPromises = [];

    products.forEach(product => {
      insertPromises.push( this.productService.create( product, user ) );  
    })

    await Promise.all( insertPromises );

    return true;
  }
}
