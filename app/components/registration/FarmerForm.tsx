import { useState } from "react";
import { useNavigate } from "react-router";
import { submitFarmerDetails } from "~/lib/services/registration";
import type { FarmerDetailsDto } from "~/lib/types/registration";

interface FarmerFormProps {
  registrationId: string;
}

const PACKAGING_OPTIONS = ['صندوق', 'كيس', 'قفص / صندوق خشبي'];

export function FarmerForm({ registrationId }: FarmerFormProps) {
  const navigate = useNavigate();
  const [nationality, setNationality] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [storageAvailable, setStorageAvailable] = useState(false);
  const [coldStorageCapacityKg, setColdStorageCapacityKg] = useState('');
  const [landOwnership, setLandOwnership] = useState('');
  const [selectedPackaging, setSelectedPackaging] = useState<string[]>([]);
  const [showPackagingModal, setShowPackagingModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePackaging = (option: string) => {
    if (selectedPackaging.includes(option)) {
      setSelectedPackaging(selectedPackaging.filter((p) => p !== option));
    } else {
      setSelectedPackaging([...selectedPackaging, option]);
    }
  };

  const onSubmit = async () => {
    if (!nationality || !birthDate || !province || !district) {
      setError('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitFarmerDetails({
        registrationId,
        nationality,
        birthDate: new Date(birthDate).toISOString(),
        birthPlace,
        province,
        district,
        farmAddress,
        locationLat: parseFloat(locationLat || '0'),
        locationLng: parseFloat(locationLng || '0'),
        storageAvailable,
        coldStorageCapacityKg: parseFloat(coldStorageCapacityKg || '0'),
        landOwnership,
        packagingMethods: selectedPackaging,
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
          الجنسية
          <span className="text-red-500 mr-1">*</span>
        </label>
        <input
          type="text"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="ادخل الجنسية"
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          تاريخ الميلاد
          <span className="text-red-500 mr-1">*</span>
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          مكان الميلاد
        </label>
        <input
          type="text"
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          placeholder="ادخل مكان الميلاد"
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          المحافظة
          <span className="text-red-500 mr-1">*</span>
        </label>
        <input
          type="text"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="ادخل المحافظة"
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          المنطقة
          <span className="text-red-500 mr-1">*</span>
        </label>
        <input
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="ادخل المنطقة"
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          عنوان المزرعة
        </label>
        <textarea
          value={farmAddress}
          onChange={(e) => setFarmAddress(e.target.value)}
          placeholder="ادخل عنوان المزرعة"
          rows={3}
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          موقع المزرعة (إحداثيات)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            step="any"
            value={locationLat}
            onChange={(e) => setLocationLat(e.target.value)}
            placeholder="خط العرض"
            className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
            dir="rtl"
          />
          <input
            type="number"
            step="any"
            value={locationLng}
            onChange={(e) => setLocationLng(e.target.value)}
            placeholder="خط الطول"
            className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
            dir="rtl"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          ملكية الأرض
        </label>
        <input
          type="text"
          value={landOwnership}
          onChange={(e) => setLandOwnership(e.target.value)}
          placeholder="مملوكة / مستأجرة"
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
          dir="rtl"
        />
      </div>

      <div className="flex flex-row-reverse items-center justify-between px-4 py-4 border border-gray-300 rounded-lg bg-white">
        <label className="text-base" style={{ fontFamily: 'Cairo, sans-serif' }}>
          هل يتوفر تخزين بارد؟
        </label>
        <button
          type="button"
          onClick={() => setStorageAvailable(!storageAvailable)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            storageAvailable ? 'bg-green-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              storageAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {storageAvailable && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
            سعة التخزين البارد (كغ)
          </label>
          <input
            type="number"
            value={coldStorageCapacityKg}
            onChange={(e) => setColdStorageCapacityKg(e.target.value)}
            placeholder="ادخل السعة بالكيلوغرام"
            className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
            dir="rtl"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
          طرق التعبئة
        </label>
        <button
          type="button"
          onClick={() => setShowPackagingModal(true)}
          className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 flex flex-row-reverse items-center justify-between hover:border-green-500 transition-colors"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          <span>{selectedPackaging.length > 0 ? selectedPackaging.join(', ') : 'اختر طرق التعبئة'}</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showPackagingModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowPackagingModal(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-row-reverse items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اختر طرق التعبئة
              </h3>
              <button
                onClick={() => setShowPackagingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {PACKAGING_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => togglePackaging(option)}
                  className="w-full flex flex-row-reverse items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {option}
                  </span>
                  {selectedPackaging.includes(option) && (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowPackagingModal(false)}
                className="w-full mt-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

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

