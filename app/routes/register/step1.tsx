import type { Route } from "../+types/register.step1";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "~/hooks/useAuth";
import { Header } from "~/components/Header";
import { ProgressStepper } from "~/components/registration/ProgressStepper";
import { startRegistration, step1Account } from "~/lib/services/registration";
import { getRegistrationId } from "~/lib/storage/registration-storage";

const COUNTRIES = [
  { code: '+963', name: 'سوريا', flag: '🇸🇾', nameEn: 'Syria' },
  { code: '+962', name: 'الأردن', flag: '🇯🇴', nameEn: 'Jordan' },
  { code: '+20', name: 'مصر', flag: '🇪🇬', nameEn: 'Egypt' },
  { code: '+966', name: 'السعودية', flag: '🇸🇦', nameEn: 'Saudi Arabia' },
  { code: '+971', name: 'الإمارات', flag: '🇦🇪', nameEn: 'UAE' },
  { code: '+961', name: 'لبنان', flag: '🇱🇧', nameEn: 'Lebanon' },
  { code: '+964', name: 'العراق', flag: '🇮🇶', nameEn: 'Iraq' },
  { code: '+965', name: 'الكويت', flag: '🇰🇼', nameEn: 'Kuwait' },
  { code: '+968', name: 'عمان', flag: '🇴🇲', nameEn: 'Oman' },
  { code: '+974', name: 'قطر', flag: '🇶🇦', nameEn: 'Qatar' },
  { code: '+973', name: 'البحرين', flag: '🇧🇭', nameEn: 'Bahrain' },
  { code: '+967', name: 'اليمن', flag: '🇾🇪', nameEn: 'Yemen' },
  { code: '+970', name: 'فلسطين', flag: '🇵🇸', nameEn: 'Palestine' },
  { code: '+90', name: 'تركيا', flag: '🇹🇷', nameEn: 'Turkey' },
];

const registerSchema = z.object({
  fullName: z.string().min(1, "الرجاء إدخال الاسم الكامل"),
  email: z.string().email("البريد الإلكتروني غير صحيح").min(1, "الرجاء إدخال البريد الإلكتروني"),
  phone: z.string().min(1, "الرجاء إدخال رقم الهاتف"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "الرجاء تأكيد كلمة المرور"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور وتأكيد كلمة المرور غير متطابقتين",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "الخطوة 1: البيانات الأساسية - Rizaq" },
  ];
}

export default function RegisterStep1() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loadingRegistrationId, setLoadingRegistrationId] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const initRegistration = async () => {
      try {
        let id = await getRegistrationId();
        
        if (!id) {
          const response = await startRegistration();
          if (response?.success && response?.data?.registrationId) {
            id = response.data.registrationId;
          } else {
            throw new Error('فشل في بدء جلسة التسجيل');
          }
        }
        
        if (!id) {
          throw new Error('لم يتم الحصول على معرف التسجيل');
        }
        
        setRegistrationId(id);
      } catch (err: any) {
        console.error('Error initializing registration:', err);
        setError(err?.message || 'فشل في تهيئة جلسة التسجيل. الرجاء المحاولة مرة أخرى.');
      } finally {
        setLoadingRegistrationId(false);
      }
    };

    initRegistration();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    if (!registrationId) {
      setError('جلسة التسجيل مفقودة. الرجاء تحديث الصفحة والمحاولة مرة أخرى.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const fullPhone = selectedCountry.code + data.phone;
      const response = await step1Account({
        registrationId,
        fullName: data.fullName,
        email: data.email,
        phone: fullPhone,
        password: data.password,
      });

      if (response.success) {
        if (response.data?.devOtp) {
          console.log('Dev OTP:', response.data.devOtp);
        }
        navigate("/register/otp");
      } else {
        setError('فشل في إرسال رمز التحقق. الرجاء المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setError(err?.message || 'فشل في إرسال رمز التحقق. الرجاء التحقق من بياناتك والمحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingRegistrationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
              أنت مسجل دخول بالفعل
            </h2>
            <Link
              to="/"
              className="inline-block w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 mb-3"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
              الذهاب للرئيسية
            </Link>
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
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            العودة للرئيسية
          </Link>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                البيانات الأساسية
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الخطوة 1 من 6: أدخل بياناتك الأساسية
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  الاسم الكامل
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  {...register("fullName")}
                  placeholder="احمد محمد حسن مصطفى"
                  className={`w-full px-4 py-3 text-right border rounded-lg bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                  }`}
                  style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                  dir="rtl"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  البريد الإلكتروني
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="ادخل بريدك الالكتروني"
                  className={`w-full px-4 py-3 text-right border rounded-lg bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                  }`}
                  style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                  dir="rtl"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  رقم الهاتف
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="flex flex-row-reverse border rounded-lg bg-white overflow-hidden">
                  <input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="08 88xx xxx"
                    maxLength={9}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setValue("phone", value);
                    }}
                    className={`flex-1 px-4 py-3 text-right border-none bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? "focus:ring-red-500"
                        : "focus:ring-green-500"
                    }`}
                    style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker(true)}
                    className="border-l border-gray-300 px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {selectedCountry.code}
                    </span>
                    <span className="text-2xl">{selectedCountry.flag}</span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {showCountryPicker && (
                <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowCountryPicker(false)}>
                  <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-row-reverse items-center justify-between p-6 border-b border-gray-200">
                      <h3 className="text-xl font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                        اختر رمز الدولة
                      </h3>
                      <button
                        onClick={() => setShowCountryPicker(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {COUNTRIES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryPicker(false);
                          }}
                          className={`w-full flex flex-row-reverse items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            selectedCountry.code === country.code ? 'bg-green-50' : ''
                          }`}
                        >
                          <div className="flex flex-row-reverse items-center gap-3">
                            <span className="text-2xl">{country.flag}</span>
                            <span className="text-base" style={{ fontFamily: 'Cairo, sans-serif' }}>
                              {country.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-base text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
                              {country.code}
                            </span>
                            {selectedCountry.code === country.code && (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  كلمة المرور
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="ادخل كلمة المرور"
                    className={`w-full px-4 py-3 pr-12 text-right border rounded-lg bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 ${
                      errors.password
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                    }`}
                    style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L7.5 7.5m-1.21-1.21L3 3m0 0l3.29 3.29M21 21l-3.29-3.29m0 0L16.5 16.5m1.21-1.21L21 21m0 0l-3.29-3.29m0 0L16.5 16.5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  تأكيد كلمة المرور
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    placeholder="ادخل كلمة المرور مرة أخرى"
                    className={`w-full px-4 py-3 pr-12 text-right border rounded-lg bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                    }`}
                    style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L7.5 7.5m-1.21-1.21L3 3m0 0l3.29 3.29M21 21l-3.29-3.29m0 0L16.5 16.5m1.21-1.21L21 21m0 0l-3.29-3.29m0 0L16.5 16.5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !registrationId}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                  submitting || !registrationId
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
                    جاري الإرسال...
                  </span>
                ) : (
                  "التالي"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

