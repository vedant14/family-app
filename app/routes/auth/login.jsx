import { useGoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router";
import { classNames } from "~/utils/helperFunctions";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAuthStore } from "~/utils/store";
import axios from "axios";
import { useEffect } from "react";
export default function Login({ className, ...props }) {
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate(); // Initialize navigation
  const user = useAuthStore((state) => state.user);
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user]);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      const tokens = await axios.post("/api/fetch-token", {
        code: codeResponse.code,
      });
      navigate("/");
      createUser(tokens.data, setUser);
    },
    flow: "auth-code",
    scope:
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events.owned",
  });

  return (
    <div
      className={classNames(
        "flex flex-col gap-6 bg-gray-100 h-screen",
        className
      )}
    >
      <Card className="overflow-hidden lg:w-4xl m-auto mt-1/2 py-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-">
            <form>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-balance text-muted-foreground">
                    Login to your finance account
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="#"
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </div>
            </form>
            <div className="mt-4">
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => login()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
              </Button>
            </div>
          </div>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/main.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const createUser = async (tokens, setUser) => {
  try {
    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tokens),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data);
    } else {
      console.error("Error creating user:", data.error);
    }
  } catch (error) {
    console.error("Error creating user:", error);
  }
};
