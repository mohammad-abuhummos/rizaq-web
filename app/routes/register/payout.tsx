import type { Route } from "../+types/register.payout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/Header";
import { ProgressStepper } from "~/components/registration/ProgressStepper";
import { addPayoutAccount, completeRegistrationStep5, getPayoutAccounts, setDefaultPayout, submitRegistration } from "~/lib/services/registration";
import { getRegistrationId } from "~/lib/storage/registration-storage";
import { useAuth } from "~/hooks/useAuth";

const PAYOUT_TYPES = [
  { id: 1, label: 'حساب بنكي', labelEn: 'Bank Account' },
  { id: 2, label: 'محفظة إلكترونية', labelEn: 'E-Wallet' },
  { id: 3, label: 'نقدي', labelEn: 'Cash' },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "الخطوة 6: طريقة الدفع - Rizaq" },
  ];
}

export default function RegisterPayout() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(PAYOUT_TYPES[0]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [isDefault, setIsDefault] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasAddedAccount, setHasAddedAccount] = useState(false);

  useEffect(() => {
    getRegistrationId().then(setRegistrationId);
  }, []);

  useEffect(() => {
    if (!registrationId) return;
    getPayoutAccounts(registrationId)
      .then((res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          setPayouts(res.data);
          setHasAddedAccount(res.data.length > 0);
        } else if (Array.isArray(res)) {
          setPayouts(res);
          setHasAddedAccount(res.length > 0);
        }
      })
      .catch(() => {});
  }, [registrationId]);

  const onAdd = async () => {
    if (!registrationId) {
      setError('جلسة التسجيل مفقودة');
      return;
    }
    if (!providerName || !accountNumber) {
      setError('الرجاء ملء اسم المزود ورقم الحساب');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await addPayoutAccount({
        registrationId,
        type: selectedType.id,
        providerName,
        accountNumber,
        iban: iban || '',
        isDefault,
      });
      if (res.success) {
        setProviderName('');
        setAccountNumber('');
        setIban('');
        const list = await getPayoutAccounts(registrationId);
        if ((list as any)?.success && Array.isArray((list as any)?.data)) {
          setPayouts((list as any).data);
          setHasAddedAccount(true);
        } else if (Array.isArray(list)) {
          setPayouts(list as any);
          setHasAddedAccount(true);
        }
      } else {
        setError('فشل حفظ حساب الدفع');
      }
    } catch (e: any) {
      setError(e?.message || 'فشل حفظ حساب الدفع');
    } finally {
      setLoading(false);
    }
  };

  const onSetDefault = async (payoutId: number) => {
    if (!registrationId) return;
    try {
      await setDefaultPayout(payoutId, registrationId);
      const list = await getPayoutAccounts(registrationId);
      if ((list as any)?.success && Array.isArray((list as any)?.data)) {
        setPayouts((list as any).data);
      } else if (Array.isArray(list)) {
        setPayouts(list as any);
      }
    } catch {}
  };

  const onCompleteAndSubmit = async () => {
    if (!registrationId) return;
    setCompleting(true);
    setError(null);
    try {
      await completeRegistrationStep5(registrationId);
      const submitRes = await submitRegistration(registrationId);
      
      // Auto-login after successful registration
      // Extract credentials from registration data if available
      // For now, redirect to login
      alert('تم إكمال التسجيل بنجاح! الرجاء تسجيل الدخول');
      navigate('/login');
    } catch (e: any) {
      setError(e?.message || 'فشل إكمال التسجيل');
      setCompleting(false);
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                طريقة الدفع
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الخطوة 6 من 6: أضف حساب الدفع الخاص بك
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  نوع الحساب
                </label>
                <button
                  type="button"
                  onClick={() => setShowTypePicker(true)}
                  className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 flex flex-row-reverse items-center justify-between hover:border-green-500 transition-colors"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <span>{selectedType.label}</span>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {showTypePicker && (
                <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowTypePicker(false)}>
                  <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-row-reverse items-center justify-between p-6 border-b border-gray-200">
                      <h3 className="text-xl font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                        اختر نوع الحساب
                      </h3>
                      <button
                        onClick={() => setShowTypePicker(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6">
                      {PAYOUT_TYPES.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setSelectedType(type);
                            setShowTypePicker(false);
                          }}
                          className="w-full flex flex-row-reverse items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-base" style={{ fontFamily: 'Cairo, sans-serif' }}>
                            {type.label}
                          </span>
                          {selectedType.id === type.id && (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  اسم المزود
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="البنك أو المحفظة"
                  className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  رقم الحساب
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="ادخل رقم الحساب"
                  className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  IBAN (اختياري)
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  placeholder="ادخل رقم IBAN"
                  className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                  dir="rtl"
                />
              </div>

              <div className="flex flex-row-reverse items-center justify-between px-4 py-4 border border-gray-300 rounded-lg bg-white">
                <label className="text-base" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  حساب افتراضي
                </label>
                <button
                  type="button"
                  onClick={() => setIsDefault(!isDefault)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDefault ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDefault ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={onAdd}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-300 border-2 ${
                  loading
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 border-green-700 hover:bg-green-50'
                }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center text-green-700">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الإضافة...
                  </span>
                ) : (
                  <span className="flex items-center justify-center text-green-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة حساب دفع
                  </span>
                )}
              </button>

              {payouts.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    حسابات الدفع المضافة
                  </h3>
                  <div className="space-y-4">
                    {payouts.map((item: any) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-row-reverse items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-base font-semibold text-right mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                              {item.providerName}
                            </p>
                            <p className="text-sm text-gray-600 text-right mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                              الحساب: {item.accountNumber}
                            </p>
                            {item.iban && (
                              <p className="text-sm text-gray-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                IBAN: {item.iban}
                              </p>
                            )}
                          </div>
                          {item.isDefault && (
                            <div className="bg-green-100 px-3 py-1 rounded-full">
                              <span className="text-green-700 text-xs font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                افتراضي
                              </span>
                            </div>
                          )}
                        </div>
                        {!item.isDefault && (
                          <button
                            type="button"
                            onClick={() => onSetDefault(item.id)}
                            className="w-full mt-2 py-2 bg-green-50 rounded-lg text-green-700 font-semibold hover:bg-green-100 transition-colors"
                            style={{ fontFamily: 'Cairo, sans-serif' }}
                          >
                            تعيين كافتراضي
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={hasAddedAccount ? onCompleteAndSubmit : () => setError('الرجاء إضافة حساب دفع واحد على الأقل قبل إكمال التسجيل')}
                disabled={completing}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                  completing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                }`}
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                {completing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري إكمال التسجيل...
                  </span>
                ) : (
                  "إكمال التسجيل"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

