export abstract class User{
    private realName: string;
    private password: string;
    private userName: string;
    private birthday: Date;
    private bio: String;
    private tags: Array<string>;
    private courses: Array<string>;

    //maybe add tags and courses as arguments from the results of the database queries

    //maybe the builder design pattern would be better here?
    constructor(rn: string, pass: string, un: string, birth: Date, bio: string){
        this.realName = rn;
        this.password = pass;
        this.userName = un;
        this.birthday = birth;
        this.bio = bio;
    }
}