import React from "react";
import { useLocation } from "react-router";

const STEPS = [
  { route: '/register/step1', step: 1, label: 'البيانات الأساسية' },
  { route: '/register/otp', step: 2, label: 'التحقق' },
  { route: '/register/role', step: 3, label: 'الدور' },
  { route: '/register/details', step: 4, label: 'التفاصيل' },
  { route: '/register/documents', step: 5, label: 'المستندات' },
  { route: '/register/payout', step: 6, label: 'الدفع' },
];

export function ProgressStepper() {
  const location = useLocation();
  const currentStepIndex = STEPS.findIndex((s) => location.pathname === s.route);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 0;

  // Don't show stepper on main register page
  if (location.pathname === '/register' || currentStep === 0) {
    return null;
  }

  return (
    <div className="bg-white px-6 py-4 border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((_, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;

            return (
              <React.Fragment key={index}>
                <div
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    isCompleted || isActive
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                      : 'bg-gray-300'
                  }`}
                />
                {index < STEPS.length - 1 && <div className="w-1" />}
              </React.Fragment>
            );
          })}
        </div>
        {currentStep > 0 && (
          <p className="text-center mt-3 text-sm text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
            الخطوة {currentStep} من {STEPS.length}: {STEPS[currentStepIndex]?.label}
          </p>
        )}
      </div>
    </div>
  );
}

