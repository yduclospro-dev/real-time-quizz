import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmQuitSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmQuitSessionModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmQuitSessionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quitter la session ?"
      showCloseButton={false}
    >
      <p className="text-gray-600 mb-6">
        Êtes-vous sûr de vouloir quitter cette session ? Vous ne pourrez pas revenir en arrière.
      </p>
      <div className="flex gap-3 justify-end">
        <Button variant="primary" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="outline" onClick={onConfirm}>
          Quitter
        </Button>
      </div>
    </Modal>
  );
}
