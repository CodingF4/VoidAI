import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VerificationGameProps {
  onComplete: (code: string) => void;
  onSkip: () => void;
}

export function VerificationGame({ onComplete, onSkip }: VerificationGameProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  // Handle input change
  const handleInput = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single character

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto advance to next input
    if (value && index < 5) {
      setCurrentIndex(index + 1);
    }

    // Check if code is complete
    if (value && index === 5) {
      const fullCode = newCode.join('');
      onComplete(fullCode);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      setCurrentIndex(index - 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setCurrentIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      setCurrentIndex(index + 1);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-card">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Verification Challenge</h3>
        <p className="text-muted-foreground">
          Enter the 6-digit code sent to your email
        </p>
        <div className="mt-2 text-sm">
          Score: {score} points
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {code.map((digit, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8 }}
            animate={{ 
              scale: currentIndex === index ? 1.1 : 1,
              borderColor: currentIndex === index ? 'var(--primary)' : undefined
            }}
            className="relative"
          >
            <Input
              type="text"
              value={digit}
              onChange={(e) => handleInput(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setCurrentIndex(index)}
              className="w-12 h-12 text-center text-lg font-bold"
              maxLength={1}
              autoFocus={index === currentIndex}
              aria-label={`Verification code digit ${index + 1}`}
            />
            <AnimatePresence>
              {digit && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2"
                >
                  <div className="w-4 h-4 bg-primary rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onSkip}>
          Skip Challenge
        </Button>
        <div className="flex items-center gap-2">
          {isValid !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`text-sm ${isValid ? 'text-green-500' : 'text-red-500'}`}
            >
              {isValid ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
