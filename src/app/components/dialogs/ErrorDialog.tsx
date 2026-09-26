import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useWorkspace } from '../../stores/workspace';
import { useT } from '../../i18n';

export function ErrorDialog() {
  const t = useT();
  const { lastError, showError } = useWorkspace();
  const json = lastError ? JSON.stringify(lastError.details ?? {}, null, 2) : '';

  return (
    <Dialog open={!!lastError} onOpenChange={(o) => !o && showError(null)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('errors.details')}</DialogTitle>
          <DialogDescription>
            {lastError?.status ? `HTTP ${lastError.status} · ` : ''}
            {lastError?.message}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <pre className="max-h-[50vh] overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">{json}</pre>
          <Button
            size="icon-sm"
            variant="ghost"
            className="absolute top-2 right-2"
            onClick={async () => {
              await navigator.clipboard.writeText(json);
              toast.success(t('common.copied'));
            }}
            aria-label={t('common.copy')}
          >
            <Copy />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
