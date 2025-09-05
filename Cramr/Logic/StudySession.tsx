export abstract class StudySession {
    private location: string;
    private time: Date;
    private subject: string
    

    constructor(location:string, time: Date, subject: string){
        this.location = location;
        this.time = time;
        this.subject = subject;
    }

    public get getLocation():string{
        return this.location
    }
}