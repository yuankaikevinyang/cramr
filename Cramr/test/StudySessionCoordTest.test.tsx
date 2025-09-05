import { beforeAll, describe, expect, test } from '@jest/globals';
import { PublicStudySession } from '../Logic/PublicStudySession';


var testStudySession: PublicStudySession;

beforeAll(() => {
    testStudySession = new PublicStudySession("9836 Hopkins Dr, La Jolla, CA 92093", new Date(), "Math");
});

describe('testing to see if the geocoding functionality actually works', () => {
    test('converting the address to coordinates', async () => {
        //We're using SDSC's physical address as our test dummy :P
        const pulledCord = testStudySession.addressToCoordinates(); //will edit so that it calls from private variable in Public Study Session
        expect(JSON.stringify((await pulledCord).geometry.location.lat) + ", " + JSON.stringify((await pulledCord).geometry.location.lng)).toBe("32.88439, -117.239172");
    }, 15000); // 15 second timeout for geocoding API call
});