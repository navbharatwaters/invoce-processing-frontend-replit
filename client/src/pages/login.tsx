import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate({ ...data, rememberMe });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <Card className="bg-white shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img 
                  src="/images/logo.jpeg" 
                  alt="Navbharat Waters Logo" 
                  className="h-24 w-auto"
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Navbharat Waters</h1>
              <p className="text-gray-600">AI-Powered Document Processer</p>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  {...form.register("username")}
                  className="w-full"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.username.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...form.register("password")}
                  className="w-full"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
                <Label htmlFor="remember" className="text-sm text-gray-700">
                  Remember me
                </Label>
              </div>
              
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Demo credentials: admin / admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
