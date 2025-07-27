import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { Users } from 'src/modules/users/Entyties/users.entity';

@Entity('addresses')
@Index(['latitude', 'longitude'])
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: false,
  })
  street: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: false,
  })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: false,
  })
  longitude: number;

  @OneToOne(() => Users, (user) => user.address, { onDelete: 'CASCADE' })
  user: Users;
}
