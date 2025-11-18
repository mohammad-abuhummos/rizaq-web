import type { Route } from "../+types/register.documents";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/Header";
import { ProgressStepper } from "~/components/registration/ProgressStepper";
import {
  completeRegistrationStep4,
  deleteRegistrationDocument,
  listRegistrationDocuments,
  uploadRegistrationDocument,
} from "~/lib/services/registration";
import { getRegistrationId, getSelectedRole } from "~/lib/storage/registration-storage";
import type { UserRole } from "~/lib/types/registration";

type DocTypeDef = {
  id: number;
  label: string;
  labelAr: string;
  optional?: boolean;
};

const roleDocMap: Record<UserRole, DocTypeDef[]> = {
  farmer: [
    { id: 1, label: "National ID Photo", labelAr: "هوية شخصية", optional: true },
    { id: 2, label: "Policy Agreement", labelAr: "اتفاقية السياسة", optional: true },
    { id: 3, label: "Payout Method Proof", labelAr: "إثبات طريقة الدفع", optional: true },
  ],
  trader: [
    { id: 10, label: "Commercial License Photo", labelAr: "صورة الترخيص التجاري" },
    { id: 11, label: "Commercial License Number", labelAr: "رقم الترخيص التجاري" },
    { id: 12, label: "Tax Number", labelAr: "الرقم الضريبي" },
  ],
  transporter: [
    { id: 20, label: "Company License", labelAr: "ترخيص الشركة" },
    { id: 21, label: "Driver License", labelAr: "رخصة القيادة" },
  ],
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "الخطوة 5: المستندات - Rizaq" },
  ];
}

export default function RegisterDocuments() {
  const navigate = useNavigate();
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocTypeDef | null>(null);
  const [showDocTypePicker, setShowDocTypePicker] = useState(false);
  const [numberText, setNumberText] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasUploadedDoc, setHasUploadedDoc] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const id = await getRegistrationId();
      const selectedRole = await getSelectedRole();
      setRegistrationId(id);
      setRole(selectedRole);
      
      if (id) {
        try {
          const res = await listRegistrationDocuments(id);
          if (res?.success && Array.isArray(res.data)) {
            setDocuments(res.data);
            setHasUploadedDoc(res.data.length > 0);
          }
        } catch {}
      }
    };
    loadData();
  }, []);

  const docsForRole = useMemo(() => (role ? roleDocMap[role] : []), [role]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const onUpload = async () => {
    if (!registrationId || !selectedDocType || !file) {
      setError("الرجاء اختيار نوع المستند ورفع ملف");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await uploadRegistrationDocument({
        registrationId,
        docType: selectedDocType.id,
        number: numberText || undefined,
        issuedBy: issuedBy || undefined,
        expiryDate: expiryDate || undefined,
        file,
      });
      if (res.success) {
        setNumberText("");
        setIssuedBy("");
        setExpiryDate("");
        setFile(null);
        setFilePreview(null);
        setSelectedDocType(null);
        const list = await listRegistrationDocuments(registrationId);
        if (list.success && Array.isArray(list.data)) {
          setDocuments(list.data);
          setHasUploadedDoc(true);
        }
      } else {
        setError('فشل رفع المستند');
      }
    } catch (e: any) {
      setError(e?.message || "فشل رفع المستند");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!registrationId) return;
    try {
      await deleteRegistrationDocument(registrationId, id);
      const list = await listRegistrationDocuments(registrationId);
      if (list.success && Array.isArray(list.data)) {
        setDocuments(list.data);
        setHasUploadedDoc(list.data.length > 0);
      }
    } catch {}
  };

  const onComplete = async () => {
    if (!registrationId) return;
    try {
      await completeRegistrationStep4(registrationId);
      navigate("/register/payout");
    } catch (e: any) {
      setError(e?.message || "فشل إكمال الخطوة");
    }
  };

  const onSkip = () => {
    navigate("/register/payout");
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
                المستندات الشخصية
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الخطوة 5 من 6: ارفع المستندات المطلوبة
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
                  نوع المستند
                </label>
                <button
                  type="button"
                  onClick={() => setShowDocTypePicker(true)}
                  className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 flex flex-row-reverse items-center justify-between hover:border-green-500 transition-colors"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <span className={selectedDocType ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedDocType ? selectedDocType.labelAr : "نوع المستند المرفق"}
                  </span>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {showDocTypePicker && (
                <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowDocTypePicker(false)}>
                  <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-row-reverse items-center justify-between p-6 border-b border-gray-200">
                      <h3 className="text-xl font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                        اختر نوع المستند
                      </h3>
                      <button
                        onClick={() => setShowDocTypePicker(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {docsForRole.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            setSelectedDocType(doc);
                            setShowDocTypePicker(false);
                          }}
                          className={`w-full flex flex-row-reverse items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            selectedDocType?.id === doc.id ? 'bg-green-50' : ''
                          }`}
                        >
                          <div className="flex flex-row-reverse items-center gap-3">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                              selectedDocType?.id === doc.id ? 'border-green-600 bg-green-600' : 'border-gray-300'
                            }`}>
                              {selectedDocType?.id === doc.id && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-base" style={{ fontFamily: 'Cairo, sans-serif' }}>
                              {doc.labelAr}
                            </span>
                          </div>
                          {doc.optional && (
                            <span className="text-sm text-gray-500" style={{ fontFamily: 'Cairo, sans-serif' }}>
                              (اختياري)
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedDocType && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      رقم المستند
                    </label>
                    <input
                      type="text"
                      value={numberText}
                      onChange={(e) => setNumberText(e.target.value)}
                      placeholder="ادخل رقم المستند"
                      className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      جهة الإصدار
                    </label>
                    <input
                      type="text"
                      value={issuedBy}
                      onChange={(e) => setIssuedBy(e.target.value)}
                      placeholder="ادخل جهة الإصدار"
                      className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      تاريخ الانتهاء
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      style={{ fontFamily: 'Cairo, sans-serif', color: '#111827' }}
                      dir="rtl"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  المستندات (الهويات / جوازات السفر)
                  <span className="text-red-500 mr-1">*</span>
                </label>

                {filePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <img src={filePreview} alt="Preview" className="w-40 h-40 mx-auto mb-4 rounded-lg object-cover" />
                    <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {file?.name}
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        type="button"
                        onClick={onUpload}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                      >
                        {loading ? (
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            رفع
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setFilePreview(null);
                        }}
                        className="px-6 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-400 mb-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      رفع المستند
                    </p>
                    <label className="inline-block px-6 py-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                      <span className="text-green-700 font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                        اختر ملف
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    المستندات المرفوعة
                  </h3>
                  <div className="space-y-4">
                    {documents.map((item: any) => (
                      <div key={item.id || item.documentId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-row-reverse items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-base font-semibold text-right mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                              مستند #{item.documentId || item.id}
                            </p>
                            {item.number && (
                              <p className="text-sm text-gray-600 text-right" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                الرقم: {item.number}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onDelete(item.documentId || item.id)}
                            className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {item.fileUrl && (
                          <img src={item.fileUrl} alt="Document" className="w-full h-40 rounded-lg object-cover mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4">
                <button
                  type="button"
                  onClick={hasUploadedDoc ? onComplete : () => setError('الرجاء رفع المستندات المطلوبة قبل المتابعة')}
                  className="w-full py-3 px-4 rounded-lg font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  التالي
                </button>

                <button
                  type="button"
                  onClick={onSkip}
                  className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  تخطي
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

