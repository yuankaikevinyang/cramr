import { Client } from "@googlemaps/google-maps-services-js";
import { StudySession } from "./StudySession";
import { User } from "./User";

export class PrivateStudySession extends StudySession{
    private attendance: Array<User>;
    private client;

    constructor(location: string, time: Date, subject: string){
        super(location, time, subject);
        this.attendance = [];
        this.client = new Client({});
    }

    // Add logic here, most likely with Google Maps API.
    // Most likely, it will allow home addresses to be placed in location in the constructor
    // Geocoding has establishment type, we can enforce frontend from that.

    // turning address to coordinates so that it can be displayed in frontend (although we might store the location as an array instead for security purposes)
    //returns a google LatLng object, which works well with front end map. Change after 
    public async addressToCoordinates(){
        try {
            const response = await this.client.geocode({
                params : {
                    key: process.env.EXPO_PUBLIC_GOOGLE_API_KEY, //we're gonna use environment variables for the API Key in final production code
                    address: this.getLocation,
                    
                },
                timeout: 1000 //might be shorter given the constraints of the project.
            });
            return response.data.results[0]; //returns a JSON. You can access coords from geometry.location and
        } catch (error) {
            console.error("Error decoding address:" , error);
            throw new Error("Failed to decode address");
        }
    }


}