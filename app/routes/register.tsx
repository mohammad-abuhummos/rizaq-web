import type { Route } from "./+types/register";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "إنشاء حساب جديد - Rizaq" },
    {
      name: "description",
      content: "سجل حسابك الجديد في منصة رزق الزراعية",
    },
  ];
}

export default function Register() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/");
    } else if (!authLoading) {
      navigate("/register/step1");
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return null;
}

