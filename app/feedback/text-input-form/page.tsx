"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TextInputForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback: ''
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Here you would typically send the data to your backend
    // After submission, you might want to redirect the user
    // router.push('/feedback/thank-you');
  };

  const steps = [
    {
      title: "የግል መረጃ",
      description: "እባክዎ የእርስዎን የስልክ ቁጥር ያስገቡ",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ሙሉ ስም</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ሙሉ ስምዎን ያስገቡ"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">የስልክ ቁጥር</label>
            <input
              type="tel"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+251 9XXXXXXXX"
              required
            />
          </div>
        </div>
      )
    },
    {
      title: "የጥቆማዎ",
      description: "ጥቆማዎን ይጻፉ",
      content: (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ጥቆማ</label>
          <textarea
            name="feedback"
            value={formData.feedback}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
            placeholder="እባክዎ ዝርዝር ጥቆማዎን ይጻፉ..."
            required
          />
        </div>
      )
    },
    {
      title: "ማረጋገጫ",
      description: "መረጃዎችዎን ይፈትሹ እና ይላኩ",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">ስም:</h4>
            <p className="text-gray-600">{formData.name}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">የስልክ ቁጥር:</h4>
            <p className="text-gray-600">{formData.email}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">ጥቆማ:</h4>
            <p className="text-gray-600 whitespace-pre-line">{formData.feedback}</p>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        {/* Progress Steps */}
        <div className="flex justify-between mb-6">
          {steps.map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step > index + 1 ? 'bg-green-500 text-white' :
                    step === index + 1 ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-600'}`}
              >
                {index + 1}
              </div>
              <span className="text-xs mt-1">ደረጃ {index + 1}</span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <h2 className="text-xl font-bold mb-1">{currentStep.title}</h2>
        <p className="text-gray-600 mb-6">{currentStep.description}</p>

        {currentStep.content}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`px-4 py-2 rounded-lg ${step === 1 ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            ቀዳሚ
          </button>

          {step < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ቀጣይ
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ላክ
            </button>
          )}
        </div>
      </form>
    </div>
  );
}