import { Column, Entity, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Users } from 'src/modules/users/Entyties/users.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  street: string;

  @Column({ type: 'float' })
  latitude: number;

  @Column({ type: 'float' })
  longitude: number;

  @OneToOne(() => Users, (user) => user.address)
  user: Users;
}
