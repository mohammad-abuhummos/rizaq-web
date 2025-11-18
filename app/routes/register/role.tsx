import type { Route } from "../+types/register.role";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/Header";
import { ProgressStepper } from "~/components/registration/ProgressStepper";
import { setRoleName } from "~/lib/services/registration";
import { getRegistrationId, getSelectedRole, saveSelectedRole } from "~/lib/storage/registration-storage";
import type { UserRole } from "~/lib/types/registration";

const roles: { value: UserRole; label: string; icon: string }[] = [
  { value: 'farmer', label: 'مزارع', icon: '🌾' },
  { value: 'trader', label: 'تاجر', icon: '💼' },
  { value: 'transporter', label: 'ناقل / موصل', icon: '🚚' },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "الخطوة 3: اختيار الدور - Rizaq" },
  ];
}

export default function RegisterRole() {
  const navigate = useNavigate();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRegistrationId().then(setRegistrationId);
    getSelectedRole().then((role) => role && setSelected(role));
  }, []);

  const onSubmit = async () => {
    if (!registrationId || !selected) {
      setError(!registrationId ? 'جلسة التسجيل مفقودة' : 'الرجاء اختيار دور');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await setRoleName({ registrationId, roleName: selected });
      if (res.success) {
        await saveSelectedRole(selected);
        navigate('/register/details');
      } else {
        setError('فشل حفظ الدور');
      }
    } catch (e: any) {
      setError(e?.message || 'فشل حفظ الدور');
    } finally {
      setSubmitting(false);
    }
  };

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الدور الوظيفي
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اختر مجالك المهني
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelected(role.value)}
                  className={`w-full flex flex-row-reverse items-center justify-between px-6 py-5 border-2 rounded-xl transition-all duration-300 ${
                    selected === role.value
                      ? 'border-green-600 bg-green-50 shadow-lg transform scale-[1.02]'
                      : 'border-gray-300 bg-white hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-row-reverse items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selected === role.value
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300'
                    }`}>
                      {selected === role.value && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-3xl">{role.icon}</span>
                    <span className={`text-lg font-semibold ${
                      selected === role.value ? 'text-green-700' : 'text-gray-700'
                    }`} style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {role.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || !selected}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                  submitting || !selected
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </span>
                ) : (
                  "التالي"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/register/otp')}
                className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                العودة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

