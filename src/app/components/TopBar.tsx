import { useState } from 'react';
import { Check, ChevronsUpDown, Command, Folder, Monitor, Moon, Pencil, Plus, Settings, Sun, Trash2, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Kbd } from './ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { useWorkspace } from '../stores/workspace';
import { useSettings, type Theme } from '../stores/settings';
import { useUI } from '../stores/ui';
import { useT } from '../i18n';
import { cn } from '../lib/utils';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD = isMac ? '⌘' : 'Ctrl';

function ProjectSwitcher() {
  const t = useT();
  const { projects, projectId, openProject, newProject, renameProject, removeProject } = useWorkspace();
  const current = projects.find((p) => p.id === projectId);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="max-w-40 gap-2 font-medium sm:max-w-56">
                <Folder className="text-muted-foreground" />
                <span className="truncate">{current?.name ?? t('topbar.untitled')}</span>
                <ChevronsUpDown className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{t('topbar.projects')}</DropdownMenuLabel>
            <div className="max-h-72 overflow-y-auto">
              {projects.map((p) => (
                <DropdownMenuItem key={p.id} onSelect={() => openProject(p.id)}>
                  <span className="truncate">{p.name}</span>
                  {p.id === projectId && <Check className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => newProject()}>
              <Plus /> {t('topbar.newProject')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setName(current?.name ?? '');
                setRenaming(true);
              }}
            >
              <Pencil /> {t('topbar.renameProject')}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
              <Trash2 /> {t('topbar.deleteProject')}
            </DropdownMenuItem>
          </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('topbar.renameProject')}</DialogTitle>
          </DialogHeader>
          <form
            id="rename-project"
            onSubmit={(e) => {
              e.preventDefault();
              renameProject(name);
              setRenaming(false);
            }}
          >
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label={t('topbar.renameProject')} />
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="rename-project">
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('topbar.deleteProject')}</AlertDialogTitle>
            <AlertDialogDescription>{t('topbar.deleteProjectConfirm', { name: current?.name ?? '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => current && removeProject(current.id)}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const THEME_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export function TopBar() {
  const t = useT();
  const { theme, lang, set } = useSettings();
  const hasKey = useSettings((s) => !!s.keys[s.provider]);
  const open = useUI((s) => s.open);
  const ThemeIcon = THEME_ICON[theme];

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b bg-sidebar px-2">
      <a href={import.meta.env.BASE_URL} className="flex items-center gap-2 rounded-md px-2 py-1 font-semibold tracking-tight" title={t('topbar.home')}>
        <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Zap className="size-3.5" fill="currentColor" />
        </span>
        <span className="hidden sm:inline">NanoThumbnail</span>
      </a>
      <span className="mx-1 h-5 w-px bg-border" />
      <ProjectSwitcher />

      <div className="ml-auto flex items-center gap-1">
        <Button variant="outline" size="sm" className="hidden gap-2 text-muted-foreground md:inline-flex" onClick={() => open('commands')}>
          <Command /> {t('topbar.commands')}
          <Kbd>{MOD} K</Kbd>
        </Button>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" aria-label={t('topbar.theme')}>
                  <ThemeIcon />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{t('topbar.theme')}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            {(['light', 'dark', 'system'] as const).map((value) => {
              const Icon = THEME_ICON[value];
              return (
                <DropdownMenuItem key={value} onSelect={() => set({ theme: value })}>
                  <Icon /> {t(`topbar.${value}`)}
                  {theme === value && <Check className="ml-auto" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="w-10 font-mono text-xs uppercase"
          onClick={() => set({ lang: lang === 'fr' ? 'en' : 'fr' })}
          aria-label={t('topbar.language')}
        >
          {lang}
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={hasKey ? 'ghost' : 'default'}
              size={hasKey ? 'icon-sm' : 'sm'}
              onClick={() => open('settings')}
              aria-label={t('topbar.settings')}
              className={cn(!hasKey && 'gap-2')}
            >
              <Settings />
              {!hasKey && <span className="hidden sm:inline">{t('topbar.keyMissing')}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('topbar.settings')}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
