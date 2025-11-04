import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const EmailSuccessPage = () => {
  return (
    <div className="h-screen grid place-content-center">
      <div className="max-w-md text-center space-y-3">
        <Image
          width={1000}
          height={1000}
          className="w-60 h-60 mx-auto"
          src="/assets/email-verification.png"
          alt="Email Verification"
        />

        <h2>Check your email</h2>

        <p>
          To confirm your email address, tap the link in the email we sent to
          you.
        </p>

        <Button asChild variant="outline">
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  );
};

export default EmailSuccessPage;
