import { useState } from "react";
import { ChevronDown, HelpCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const faqData = [
  {
    question: "How do I add a new expense?",
    answer: "Tap the \"+\" button on the home page, fill in the amount, category, and description, then hit Save. Your expense will appear in today's transactions.",
  },
  {
    question: "Can I edit or delete a transaction?",
    answer: "Yes — swipe left on any transaction in the Transactions page to reveal the delete option. To edit, tap on the transaction to open it and make changes.",
  },
  {
    question: "What does \"Hide Amounts\" do?",
    answer: "It blurs all monetary values across the app for privacy. You can tap on a blurred amount to reveal it temporarily, or toggle the setting off from here.",
  },
  {
    question: "How does the private account work?",
    answer: "When enabled, only users you approve as followers can see your profile and spending activity. Others will see a \"Private Account\" message.",
  },
  {
    question: "Does the app work offline?",
    answer: "Yes — pages you've visited before are cached and will load offline. However, actions like adding or editing expenses require an internet connection to sync with the server.",
  },
  {
    question: "How is the expense heatmap calculated?",
    answer: "The heatmap shows your daily spending intensity over the year. Darker cells mean higher spending on that day, giving you a quick visual overview of your habits.",
  },
  {
    question: "Can I export my expenses?",
    answer: "Yes — go to the Export page from the tools menu. You can export monthly or custom date-range reports as formatted Excel files.",
  },
  {
    question: "How do I change my password?",
    answer: "Go to Settings → Update Password. Enter your current password and your new password to update it. You'll be asked to log in again after the change.",
  },
];

export default function HelpFAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-28">
      <div className="mb-7 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Help & FAQs</h1>
          <p className="text-sm text-white/40 mt-1">Common questions about the app.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/4 via-transparent to-white/2 shadow-[0_0_24px_rgba(255,255,255,0.03)] overflow-hidden">
        {faqData.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index}>
              {index > 0 && <div className="h-px bg-white/5" />}
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                    <HelpCircle className="w-4 h-4 text-white/60" />
                  </div>
                  <p className="text-sm text-white">{item.question}</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/25 shrink-0 ml-2 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-200 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-3.5 pl-16 text-[12px] leading-relaxed text-white/50">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
