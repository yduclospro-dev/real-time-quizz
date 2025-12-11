import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmDeleteQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quizTitle: string;
}

export function ConfirmDeleteQuizModal({
  isOpen,
  onClose,
  onConfirm,
  quizTitle,
}: ConfirmDeleteQuizModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supprimer le quiz">
      <div className="space-y-6">
        <p className="text-gray-700">
          Êtes-vous sûr de vouloir supprimer le quiz{" "}
          <span className="font-semibold">&quot;{quizTitle}&quot;</span> ?
        </p>
        <p className="text-sm text-gray-600">
          Cette action est irréversible. Toutes les questions et les sessions associées seront également supprimées.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Supprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
