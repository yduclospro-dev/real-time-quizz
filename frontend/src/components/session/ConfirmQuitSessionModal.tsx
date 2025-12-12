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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Quitter la session ?
        </h2>
        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir quitter cette session ? Vous ne pourrez pas revenir en arrière.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Quitter
          </Button>
        </div>
      </div>
    </div>
  );
}
