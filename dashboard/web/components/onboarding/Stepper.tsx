/**
 * Shared Stepper component for the Onboarding flow.
 * Shows N steps with connecting lines; active and completed steps highlighted.
 */

interface StepperProps {
  currentStep: number; // 1-indexed
  totalSteps: number;
}

export default function Stepper({ currentStep, totalSteps }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <div key={stepNum} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                ${isCompleted ? "bg-blue-600 text-white"
                  : isActive ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-gray-100 text-gray-400"
                }`}
            >
              {stepNum}
            </div>
            {stepNum < totalSteps && (
              <div className={`w-12 h-0.5 transition-colors ${isCompleted ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
