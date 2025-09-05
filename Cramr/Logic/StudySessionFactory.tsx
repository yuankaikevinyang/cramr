import { StudySession } from "./StudySession";

export abstract class StudySessionFactory{
    private madeStudySession: StudySession;
    
    //default
    abstract createStudySession(location:string, time: Date, subject: string): StudySession;

    timeToMake(location:string, time: Date, subject: string)
    {
        this.madeStudySession = this.createStudySession(location, time, subject);
    }
}