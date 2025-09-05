import { beforeAll, describe, expect, test } from '@jest/globals';
import { TwoFactorBE } from '../app/SignIn/TwoFactor/TwoFactorBE';

var testTwoFactor: TwoFactorBE;

beforeAll(() => {
    testTwoFactor = new TwoFactorBE;
});

describe('Testing if 2FA formula works', () => {
    test("Seeing if sent 2FA can be validated", async () => {
        await testTwoFactor.sendEmailWithCode('tylerbao02@gmail.com',"Tyler Vo");
        const prompt = require('prompt-sync')();
        const userOTP = Number(prompt('Enter the sent user OTP: '));
        expect(testTwoFactor.compareOTP(userOTP)).toBeTruthy();
    })
});
