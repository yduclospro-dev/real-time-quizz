"use client";

import { useState, useEffect } from "react";
import { QuestionType } from '@shared/enums/question-type';
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface QuestionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: QuestionType, timeLimit: number) => void;
  initialType?: QuestionType;
  initialTimeLimit?: number;
}

export default function QuestionSettingsModal({
  isOpen,
  onClose,
  onConfirm,
  initialType = QuestionType.SINGLE_CHOICE,
  initialTimeLimit = 30,
}: QuestionSettingsModalProps) {
  const [type, setType] = useState<QuestionType>(initialType);
  const [timeLimit, setTimeLimit] = useState(initialTimeLimit);

  // Sync state with props when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setTimeLimit(initialTimeLimit);
    }
  }, [isOpen, initialType, initialTimeLimit]);

  const handleConfirm = () => {
    onConfirm(type, timeLimit);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Paramètres de la question">
      <div className="space-y-6">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type de question
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="questionType"
                value={QuestionType.SINGLE_CHOICE}
                checked={type === QuestionType.SINGLE_CHOICE}
                onChange={() => setType(QuestionType.SINGLE_CHOICE)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Réponse unique</div>
                <div className="text-sm text-gray-500">Une seule bonne réponse</div>
              </div>
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="questionType"
                value={QuestionType.MULTIPLE_CHOICE}
                checked={type === QuestionType.MULTIPLE_CHOICE}
                onChange={() => setType(QuestionType.MULTIPLE_CHOICE)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Réponses multiples (QCM)</div>
                <div className="text-sm text-gray-500">Plusieurs bonnes réponses possibles</div>
              </div>
            </label>
          </div>
        </div>

        {/* Time Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temps pour répondre (secondes)
          </label>
          <input
            type="number"
            min="5"
            max="300"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Confirmer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
