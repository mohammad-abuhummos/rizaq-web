import type { Route } from "../+types/register.details";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/Header";
import { ProgressStepper } from "~/components/registration/ProgressStepper";
import { FarmerForm } from "~/components/registration/FarmerForm";
import { TraderForm } from "~/components/registration/TraderForm";
import { TransporterForm } from "~/components/registration/TransporterForm";
import { getRegistrationId, getSelectedRole } from "~/lib/storage/registration-storage";
import type { UserRole } from "~/lib/types/registration";

const ROLE_TITLES: Record<UserRole, string> = {
  farmer: 'بيانات المزارع',
  trader: 'بيانات التاجر',
  transporter: 'بيانات الناقل',
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "الخطوة 4: التفاصيل - Rizaq" },
  ];
}

export default function RegisterDetails() {
  const navigate = useNavigate();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const id = await getRegistrationId();
      const selectedRole = await getSelectedRole();
      setRegistrationId(id);
      setRole(selectedRole);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!role || !registrationId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ProgressStepper />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
              لم يتم اختيار الدور أو جلسة التسجيل مفقودة
            </p>
            <button
              onClick={() => navigate('/register/role')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              العودة لاختيار الدور
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <ProgressStepper />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                {ROLE_TITLES[role]}
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الخطوة 4 من 6: أدخل بياناتك التفصيلية
              </p>
            </div>

            {role === 'farmer' && <FarmerForm registrationId={registrationId} />}
            {role === 'trader' && <TraderForm registrationId={registrationId} />}
            {role === 'transporter' && <TransporterForm registrationId={registrationId} />}
          </div>
        </div>
      </div>
    </div>
  );
}

