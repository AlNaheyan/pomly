"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputForm } from "@/components/ui/input/input-form";
import { createClient } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

export const registerFormSchema = z.object({
  name: z.string().min(3, {
    message: "Name must be at least 3 Characters.",
  }),
  email: z.string().email(),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

type RegisterValuesType = z.infer<typeof registerFormSchema>;

const defaultValues: RegisterValuesType = {
  name: "",
  email: "",
  password: "",
};

const RegisterForm = () => {
  const router = useRouter();

  const supabase = createClient();

  const form = useForm<RegisterValuesType>({
    resolver: zodResolver(registerFormSchema),
    defaultValues,
  });

  async function handleRegister(values: RegisterValuesType) {
    const { error, data } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
        data: {
          name: values.name,
        }
      },
    });

    if (error) return toast.error(error.message);

    console.log({ data });

    toast.success("Verification email sent. Check your mail.");

    router.replace("/email-verify");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleRegister)}
        className="w-full flex flex-col gap-y-4"
      >
        <InputForm
          label="Name"
          name="name"
          placeholder="John Doe"
          description=""
          required
        />

        <InputForm
          label="Email"
          name="email"
          placeholder="hello@pomly.com"
          description=""
          required
        />

        <InputForm
          type="password"
          label="Password"
          name="password"
          description=""
          required
        />

        <Button>Register</Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
