import { PublicStudySession } from "./PublicStudySession";
import { StudySessionFactory } from "./StudySessionFactory";

export class PublicStudySessionFactory extends StudySessionFactory{
    public override createStudySession(location:string, time: Date, subject: string){
        //tell frontend to display this study session to nearby users
        return new PublicStudySession(location, time, subject);
    }

    
}