import { useState } from 'react';
import { Bot, CheckCircle2, Copy, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Field } from '../Section';
import { useUI } from '../../stores/ui';
import { useAgent, type AgentStatus } from '../../agent/bridge';
import { parsePairing } from '../../agent/protocol';
import { useT } from '../../i18n';
import { cn } from '../../lib/utils';

const INSTALL_CLAUDE = 'claude mcp add nanothumbnail -- npx -y nanothumbnail-mcp';
const INSTALL_OTHER = 'npx -y nanothumbnail-mcp';

const STATUS_COLOR: Record<AgentStatus, string> = {
  off: 'bg-muted-foreground/40',
  connecting: 'bg-amber-500',
  waiting: 'bg-amber-500',
  connected: 'bg-success',
  rejected: 'bg-destructive',
  replaced: 'bg-muted-foreground/40',
};

export function AgentStatusDot({ className }: { className?: string }) {
  const status = useAgent((s) => s.status);
  const busy = useAgent((s) => s.log.some((e) => e.status === 'running'));
  return <span className={cn('size-2 rounded-full', STATUS_COLOR[status], busy && 'animate-pulse', className)} />;
}

function CopyLine({ text }: { text: string }) {
  const t = useT();
  return (
    <div className="flex items-center gap-1 rounded-md bg-muted py-1 pr-1 pl-3">
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap">{text}</code>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={t('common.copy')}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          toast.success(t('common.copied'));
        }}
      >
        <Copy />
      </Button>
    </div>
  );
}

export function AgentDialog() {
  const t = useT();
  const open = useUI((s) => s.dialog === 'agent');
  const close = useUI((s) => s.close);
  const agent = useAgent();
  const [code, setCode] = useState('');

  const manual = parsePairing(code);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-5" /> {t('agent.title')}
          </DialogTitle>
          <DialogDescription>{t('agent.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {agent.pending && (
            <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="flex items-start gap-2 text-sm">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                {t('agent.pendingText', { port: agent.pending.port })}
              </p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={agent.dismissPending}>
                  {t('agent.ignore')}
                </Button>
                <Button size="sm" onClick={agent.approvePending}>
                  {t('agent.allow')}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <AgentStatusDot className="size-2.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{t(`agent.status.${agent.status}`)}</p>
                {agent.enabled && <p className="text-xs text-muted-foreground">ws://127.0.0.1:{agent.port}</p>}
              </div>
            </div>
            {agent.enabled && agent.status !== 'rejected' && agent.status !== 'replaced' ? (
              <Button size="sm" variant="outline" onClick={agent.disconnect}>
                {t('agent.disconnect')}
              </Button>
            ) : agent.token ? (
              <Button size="sm" variant="outline" onClick={agent.reconnect}>
                {t('agent.reconnect')}
              </Button>
            ) : null}
          </div>

          {agent.status !== 'connected' && (
            <>
              <ol className="space-y-4 text-sm">
                <li className="space-y-2">
                  <p>
                    <span className="font-medium">1.</span> {t('agent.step1')}
                  </p>
                  <CopyLine text={INSTALL_CLAUDE} />
                  <p className="text-xs text-muted-foreground">{t('agent.step1Other')}</p>
                  <CopyLine text={INSTALL_OTHER} />
                </li>
                <li className="space-y-1">
                  <p>
                    <span className="font-medium">2.</span> {t('agent.step2')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('agent.step2Hint')}</p>
                </li>
              </ol>

              <Field label={t('agent.manual')} hint={t('agent.manualHint')} htmlFor="agent-code">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manual) {
                      agent.pair(manual);
                      setCode('');
                    }
                  }}
                >
                  <Input
                    id="agent-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="17821:…"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                  />
                  <Button type="submit" disabled={!manual}>
                    {t('agent.connect')}
                  </Button>
                </form>
              </Field>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t('agent.activity')}</h3>
              {agent.log.length > 0 && (
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={agent.clearLog}>
                  {t('agent.clear')}
                </Button>
              )}
            </div>
            {agent.log.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('agent.noActivity')}</p>
            ) : (
              <ul className="max-h-60 space-y-1 overflow-y-auto">
                {agent.log.map((e) => (
                  <li key={e.id} className="flex items-start gap-2 rounded-md px-1 py-1 text-sm">
                    {e.status === 'running' ? (
                      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : e.status === 'ok' ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <code className="font-mono text-xs">{e.tool}</code>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {new Date(e.startedAt).toLocaleTimeString()}
                          {e.ms !== undefined && ` · ${(e.ms / 1000).toFixed(1)} s`}
                        </span>
                      </div>
                      {e.detail && <p className="text-xs break-words text-destructive">{e.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
