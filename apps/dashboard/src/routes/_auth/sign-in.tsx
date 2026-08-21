import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sycom-learn/ui/components/button";
import { buttonVariants } from "@sycom-learn/ui/components/button-variants";
import { Checkbox } from "@sycom-learn/ui/components/checkbox";
import { Field, FieldError, FieldLabel } from "@sycom-learn/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom-learn/ui/components/form";
import { Input } from "@sycom-learn/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom-learn/ui/components/input-group";
import { toastManager } from "@sycom-learn/ui/components/toast";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth/auth-client";
import { resolvePostAuthRedirect } from "@/lib/auth/auth-redirect";
import { SESSION_QUERY_KEY } from "@/lib/auth/session";

const signInSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type SignInInput = z.infer<typeof signInSchema>;

export const Route = createFileRoute("/_auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign In | Sycom" },
      {
        name: "description",
        content: "Sign in to your Sycom account to reach your courses, progress, and certificates.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { redirect: redirectParam } = useSearch({ from: "/_auth" });
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: SignInInput) => {
    try {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }

      toastManager.add({ title: "Signed in", type: "success" });
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      await router.navigate({
        href: resolvePostAuthRedirect(router, redirectParam),
        replace: true,
      });
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

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-full space-y-3">
          <div className="space-y-2 text-center">
            <h1 className="text-lg font-medium tracking-tight">Welcome to Sycom</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          <Form {...form} className="flex w-full flex-col gap-4">
            <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
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
                          autoComplete="username"
                          placeholder="you@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
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
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            {...field}
                          />
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
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem>
                    <Field orientation="horizontal">
                      <Checkbox
                        checked={field.value}
                        id="rememberMe"
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      <FieldLabel
                        className="text-xs font-normal text-muted-foreground"
                        htmlFor="rememberMe"
                      >
                        Remember me
                      </FieldLabel>
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
                Continue
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link className={cn(buttonVariants({ variant: "link" }), "px-0")} to="/sign-up">
              Create account
            </Link>
          </p>
        </div>
      </div>
      <div className="mt-auto pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <a
            className={cn(
              buttonVariants({ variant: "link" }),
              "px-0 text-muted-foreground transition-colors hover:text-foreground",
            )}
            href={`/terms`}
          >
            Terms of Service
          </a>{" "}
          &amp;{" "}
          <a
            className={cn(
              buttonVariants({ variant: "link" }),
              "px-0 text-muted-foreground transition-colors hover:text-foreground",
            )}
            href={`/privacy`}
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
