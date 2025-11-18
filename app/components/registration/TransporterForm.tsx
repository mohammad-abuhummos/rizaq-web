import { useState } from "react";
import { useNavigate } from "react-router";
import { submitTransporterDetails } from "~/lib/services/registration";

interface TransporterFormProps {
  registrationId: string;
}

export function TransporterForm({ registrationId }: TransporterFormProps) {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('');
  const [fleetCapacity, setFleetCapacity] = useState('');
  const [coverageAreaText, setCoverageAreaText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!accountType || !fleetCapacity) {
      setError('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitTransporterDetails({
        registrationId,
        accountType,
        fleetCapacity: parseInt(fleetCapacity || '0', 10),
        coverageAreaText,
      });
      if (res.success) {
        navigate('/register/documents');
      } else {
        setError('فشل حفظ البيانات');
      }
    } catch (e: any) {
      setError(e?.message || 'فشل حفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {error}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          نوع الحساب
          <span className="text-red-500 mr-1">*</span>
        </label>
        <input
          type="text"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          placeholder="شخصي / شركة"
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          سعة الأسطول
          <span className="text-red-500 mr-1">*</span>
        </label>
        <input
          type="number"
          value={fleetCapacity}
          onChange={(e) => setFleetCapacity(e.target.value)}
          placeholder="عدد المركبات"
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          منطقة التغطية
        </label>
        <textarea
          value={coverageAreaText}
          onChange={(e) => setCoverageAreaText(e.target.value)}
          placeholder="المناطق التي يمكنك الوصول إليها"
          rows={3}
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
          submitting
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
          "حفظ ومتابعة"
        )}
      </button>
    </div>
  );
}

