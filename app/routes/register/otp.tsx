import type { Route } from "../+types/register.otp";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/Header";
import { ProgressStepper } from "~/components/registration/ProgressStepper";
import { startRegistration, verifyOtp } from "~/lib/services/registration";
import { clearRegistrationId, getRegistrationId, saveRegistrationId } from "~/lib/storage/registration-storage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "الخطوة 2: التحقق من OTP - Rizaq" },
  ];
}

export default function RegisterOTP() {
  const navigate = useNavigate();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    getRegistrationId().then(setRegistrationId);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    } else if (pastedData.length > 0) {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const onSubmit = async () => {
    const otpString = otp.join('');
    if (!registrationId) {
      setError('جلسة التسجيل مفقودة');
      return;
    }
    if (otpString.length !== 6) {
      setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await verifyOtp({ registrationId, otp: otpString });
      if (res.success && res.data?.verified) {
        navigate('/register/role');
        return;
      }
      setError('رمز التحقق غير صحيح');
    } catch (e: any) {
      const detail: string | undefined = e?.detail || e?.response?.error?.detail;
      const code: string | undefined = e?.code || e?.response?.error?.code;
      const isExpired = (code === 'invalid_operation' || e?.status === 400) && typeof detail === 'string' && /session expired/i.test(detail);
      if (isExpired) {
        await clearRegistrationId();
        const start = await startRegistration();
        await saveRegistrationId(start.data.registrationId);
        navigate('/register/step1');
        return;
      }
      setError(e?.message || 'فشل التحقق من رمز OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = () => {
    setError(null);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    // In a real app, you would call an API to resend OTP here
    alert('تم إعادة إرسال رمز التحقق');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <ProgressStepper />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                التحقق من OTP
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
                تم إرسال رمز OTP مكون من 6 أرقام لرقم هاتفك
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {error}
                </p>
              </div>
            )}

            <div className="flex flex-row-reverse justify-center gap-3 mb-8" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-14 h-16 border-2 border-gray-300 rounded-lg text-center text-2xl font-bold bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500 transition-all"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                />
              ))}
            </div>

            <div className="text-center mb-8">
              <button
                type="button"
                onClick={handleResend}
                className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                أعد إرساله
              </button>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || otp.join('').length !== 6}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                  submitting || otp.join('').length !== 6
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
                    جاري التحقق...
                  </span>
                ) : (
                  "تأكيد"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/register/step1')}
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

