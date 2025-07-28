import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './Entyties/address.entity';
import { Users } from './Entyties/users.entity';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,

    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  /**
   * Crea o actualiza la dirección asociada a un usuario
   * @param userId ID del usuario
   * @param addressData Datos de la dirección (street, latitude, longitude)
   */
  async upsertAddressForUser(
    userId: string,
    addressData: Partial<Address>,
  ): Promise<void> {
    // Buscamos el usuario con su dirección
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['address'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    try {
      if (user.address) {
        // Si el usuario ya tiene dirección, la actualizamos
        await this.addressRepository.update(user.address.id, addressData);
      } else {
        // Si no tiene, creamos una nueva dirección
        const newAddress = this.addressRepository.create(addressData);
        await this.addressRepository.save(newAddress);

        // Asociamos la nueva dirección al usuario
        user.address = newAddress;
        await this.usersRepository.save(user);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Error al actualizar/crear la dirección: ${error.message}`,
      );
    }
  }
}
