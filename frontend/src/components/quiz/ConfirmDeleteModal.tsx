"use client";

import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  questionNumber: number;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  questionNumber,
}: ConfirmDeleteModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supprimer la question">
      <div className="space-y-4">
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir supprimer la Question {questionNumber} ? Cette action est irréversible.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
            Supprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
