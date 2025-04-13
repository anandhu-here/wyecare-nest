export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  countryCode?: string;
  email?: string;
}

export class AddressDto implements Address {
  street!: string;
  city!: string;
  state!: string;
  zipCode!: string;
  country!: string;
  countryCode?: string;
  email?: string;
}
