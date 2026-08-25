import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sycom-learn/ui/components/button";
import { buttonVariants } from "@sycom-learn/ui/components/button-variants";
import { Field, FieldLabel } from "@sycom-learn/ui/components/field";
import {
  Form,
  FormControl,
  FormField,
  FormFieldError,
  FormItem,
} from "@sycom-learn/ui/components/form";
import { Input } from "@sycom-learn/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom-learn/ui/components/input-group";
import { toastManager } from "@sycom-learn/ui/components/toast";
import { marketingLinks } from "@sycom-learn/ui/lib/constants";
import { cn } from "@sycom-learn/ui/lib/utils";
import { Link, createFileRoute } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, MailCheckIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth/auth-client";

const signUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Enter a first name")
    .max(80, "First name must be 80 characters or fewer"),
  lastName: z
    .string()
    .trim()
    .min(1, "Enter a last name")
    .max(80, "Last name must be 80 characters or fewer"),
  email: z.email({ error: "Invalid email address" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpInput = z.infer<typeof signUpSchema>;

export const Route = createFileRoute("/_auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Create account | Sycom" },
      {
        name: "description",
        content:
          "Create a free Sycom account and start your team's cybersecurity training in minutes.",
      },
    ],
  }),
  component: SignUpPage,
});

/**
 * Sign-up never signs anyone in: `requireEmailVerification` means Better Auth
 * returns no session until the link in the email is used. Sending people to
 * `/dashboard` here would just bounce them back to `/sign-in`.
 */
function VerifyEmailNotice({ email }: { email: string }) {
  const [isResending, setIsResending] = useState(false);

  const onResend = async () => {
    setIsResending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      });

      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }

      toastManager.add({ title: "Verification email sent", type: "success" });
    } catch (error) {
      toastManager.add({
        title:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="w-full space-y-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <MailCheckIcon aria-hidden className="size-5 text-muted-foreground" />
        </span>

        <div className="space-y-2">
          <h1 className="text-lg font-medium tracking-tight">Check your email</h1>
          <p className="text-sm wrap-break-word text-muted-foreground">
            We sent a verification link to <span className="text-foreground">{email}</span>. Open it
            to finish setting up your account.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full"
            loading={isResending}
            onClick={onResend}
            size="lg"
            type="button"
            variant="outline"
          >
            Resend verification email
          </Button>

          <p className="text-sm text-muted-foreground">
            Already verified?{" "}
            <Link className={cn(buttonVariants({ variant: "link" }), "px-0")} to="/sign-in">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignUpInput) => {
    try {
      const { error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        callbackURL: "/dashboard",
      });

      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }

      setPendingEmail(data.email);
      toastManager.add({ title: "Verification email sent", type: "success" });
    } catch (error) {
      toastManager.add({
        title:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  if (pendingEmail) {
    return <VerifyEmailNotice email={pendingEmail} />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-full space-y-3">
          <div className="space-y-2 text-center">
            <h1 className="text-lg font-medium tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground">Get started with Sycom</p>
          </div>

          <Form {...form} className="flex w-full flex-col gap-4">
            <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <FormItem className="min-w-0">
                      <Field>
                        <FieldLabel className="text-xs text-muted-foreground">
                          First name
                        </FieldLabel>
                        <FormControl>
                          <Input autoComplete="given-name" placeholder="Ada" {...field} />
                        </FormControl>
                        <FormFieldError reserveSpace>{fieldState.error?.message}</FormFieldError>
                      </Field>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <FormItem className="min-w-0">
                      <Field>
                        <FieldLabel className="text-xs text-muted-foreground">Last name</FieldLabel>
                        <FormControl>
                          <Input autoComplete="family-name" placeholder="Lovelace" {...field} />
                        </FormControl>
                        <FormFieldError reserveSpace>{fieldState.error?.message}</FormFieldError>
                      </Field>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">
                        Email address
                      </FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="email"
                          placeholder="you@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormFieldError reserveSpace>{fieldState.error?.message}</FormFieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">Password</FieldLabel>
                      <InputGroup>
                        <FormControl>
                          <InputGroupInput
                            autoComplete="new-password"
                            placeholder="Min. 8 characters"
                            type={showPassword ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword((s) => !s)}
                          >
                            {showPassword ? (
                              <EyeOffIcon className="size-3.5" />
                            ) : (
                              <EyeIcon className="size-3.5" />
                            )}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      <FormFieldError reserveSpace>
                        {fieldState.error?.message ?? (
                          <span className="text-muted-foreground">
                            Tip: mix uppercase, lowercase, and a number for a stronger password.
                          </span>
                        )}
                      </FormFieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <Button
                className="mt-1 w-full"
                loading={form.formState.isSubmitting}
                size="lg"
                type="submit"
              >
                Create account
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className={cn(buttonVariants({ variant: "link" }), "px-0")} to="/sign-in">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <div className="mt-auto pt-6 text-center">
        <p className="text-xs wrap-break-word text-muted-foreground">
          By creating an account, you agree to our{" "}
          <a
            className={cn(
              buttonVariants({ variant: "link" }),
              "px-0 text-muted-foreground transition-colors hover:text-foreground",
            )}
            href={marketingLinks.terms}
            rel="noopener noreferrer"
            target="_blank"
          >
            Terms of Service
          </a>{" "}
          &amp;{" "}
          <a
            className={cn(
              buttonVariants({ variant: "link" }),
              "px-0 text-muted-foreground transition-colors hover:text-foreground",
            )}
            href={marketingLinks.privacy}
            rel="noopener noreferrer"
            target="_blank"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
