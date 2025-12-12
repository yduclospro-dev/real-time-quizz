"use client";

import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface ConfirmExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmExitModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmExitModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quitter sans enregistrer ?">
      <div className="space-y-4">
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir quitter ? Toutes les modifications non enregistrées seront perdues.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Continuer l&apos;édition
          </Button>
          <Button onClick={onConfirm} className="bg-red-500 hover:bg-red-600">
            Quitter
          </Button>
        </div>
      </div>
    </Modal>
  );
}
