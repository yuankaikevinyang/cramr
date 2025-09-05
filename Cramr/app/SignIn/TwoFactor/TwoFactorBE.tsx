export class TwoFactorBE {
    private secretCode: number; // might be string 

    constructor(){
        this.secretCode = Math.floor(Math.random() * (999999 + 1) + 0);
    }

    public compareOTP(OTP: number): boolean {// might be superflous but this is called when user enters the code to allow the backend top handle 
        return this.secretCode == OTP;
    }

    public scrambleCode(): void {
        this.secretCode = Math.floor(Math.random() * (999999 + 1) + 0)
    }

    public async sendEmailWithCode(userEmail: string, rn: string){
        //Using the Mailjet Node.js implementation I had made and containerized

        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/send-2fa`, { //replace with computer IP address (preferably in the .env file)
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: userEmail,
                name: rn,
                code: this.secretCode.toString().padStart(6, '0')
            })
        });

        const result = await response.json();

        if(result.success)
            console.log("2FA email sent!");
        else
            console.error("Failed to send 2FA email")
    }
}

// Add default export for expo-router
export default function TwoFactorBEScreen() {
  return null; // This is just a placeholder for expo-router
}