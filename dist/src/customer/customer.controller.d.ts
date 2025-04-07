import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    create(createCustomerDto: CreateCustomerDto): Promise<{
        first_name: string;
        last_name: string;
        email: string;
        phone_type?: string;
        country_code?: string;
        phone_number?: string;
        phone_subscription_status?: string;
        address_type?: string;
        street: string;
        street_line_2?: string;
        city: string;
        country: string;
        postal_code?: string;
        plan?: string;
        email_subscription_status?: string;
        id: string;
    }>;
    findAll(): Promise<{
        id: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
    }>;
    update(id: string, updateCustomerDto: Partial<CreateCustomerDto>): Promise<{
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_type?: string;
        country_code?: string;
        phone_number?: string;
        phone_subscription_status?: string;
        address_type?: string;
        street?: string;
        street_line_2?: string;
        city?: string;
        country?: string;
        postal_code?: string;
        plan?: string;
        email_subscription_status?: string;
        id: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
