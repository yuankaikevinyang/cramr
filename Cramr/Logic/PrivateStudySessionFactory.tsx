import { PrivateStudySession } from "./PrivateStudySession";
import { StudySessionFactory } from "./StudySessionFactory";

export class PrivateStudySessionFactory extends StudySessionFactory{
    public override createStudySession(location:string, time: Date, subject: string){
        //Maybe link to front end that it has been created and allow user to invite others
        return new PrivateStudySession(location, time, subject);
    }

    
}