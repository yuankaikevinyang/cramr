import { User } from './User';

export class Customer extends User {
    static #instance: Customer;

    //maybe set a default class with no arguments here
    private constructor(rn: string, pass: string, un: string, birth: Date, bio: string){
        super(rn, pass, un, birth, bio);
    }

    public static instance(rn: string, pass: string, un: string, birth: Date, bio: string): Customer {
        if (!Customer.#instance){
            Customer.#instance = new Customer(rn, pass, un, birth, bio);

        }

        return Customer.#instance;
    }

    
}