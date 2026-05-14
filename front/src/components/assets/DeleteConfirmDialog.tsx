import { Button, Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';

interface Props {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function DeleteConfirmDialog({
  open,
  pending,
  onClose,
  onConfirm,
  title = 'Delete Asset',
  message = 'Are you sure you want to delete this asset? This action cannot be undone.',
}: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={pending}>
          {pending ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
