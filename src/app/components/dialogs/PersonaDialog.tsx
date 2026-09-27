import { useState } from 'react';
import { ArrowLeft, ImagePlus, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Field } from '../Section';
import { Thumb } from '../Thumb';
import { useBlobUrl } from '../../hooks/use-blob-url';
import { useUI } from '../../stores/ui';
import { useWorkspace } from '../../stores/workspace';
import { deletePersona, putPersona, uid } from '../../lib/db';
import { normaliseUpload } from '../../lib/images';
import { useT } from '../../i18n';
import type { Persona, PersonaPhoto, PersonaPhotoSlot } from '../../lib/types';
import { cn } from '../../lib/utils';

const ANGLES: Array<Exclude<PersonaPhotoSlot, 'expression'>> = ['front', 'left', 'right'];

function pickFile(onFile: (file: File) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => input.files?.[0] && onFile(input.files[0]);
  input.click();
}

function PhotoSlot({ label, blob, required, onSet, onClear }: { label: string; blob?: Blob; required?: boolean; onSet: (b: Blob) => void; onClear: () => void }) {
  const url = useBlobUrl(blob);
  const [over, setOver] = useState(false);
  const accept = async (file?: File) => file?.type.startsWith('image/') && onSet(await normaliseUpload(file, 1536));
  return (
    <div className="space-y-1">
      <div
        role="button"
        tabIndex={0}
        onClick={() => pickFile(accept)}
        onKeyDown={(e) => e.key === 'Enter' && pickFile(accept)}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          accept(e.dataTransfer.files[0]);
        }}
        className={cn(
          'group relative flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 transition-colors hover:border-primary/50',
          over && 'border-primary bg-accent',
          blob && 'border-solid',
        )}
      >
        {url ? (
          <>
            <img src={url} alt={label} className="size-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"
              aria-label="Remove"
            >
              <Trash2 className="size-3" />
            </button>
          </>
        ) : (
          <UserRound className="size-8 text-muted-foreground/60" />
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {label}
        {required && ' *'}
      </p>
    </div>
  );
}

function Editor({ initial, onDone }: { initial?: Persona; onDone: () => void }) {
  const t = useT();
  const reload = useWorkspace((s) => s.reloadPersonas);
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [photos, setPhotos] = useState<PersonaPhoto[]>(initial?.photos ?? []);

  const angle = (slot: PersonaPhotoSlot) => photos.find((p) => p.slot === slot);
  const setAngle = (slot: PersonaPhotoSlot, blob: Blob) =>
    setPhotos((ps) => [...ps.filter((p) => p.slot !== slot), { id: uid('ph_'), slot, blob }]);
  const expressions = photos.filter((p) => p.slot === 'expression');

  async function save() {
    if (!name.trim()) return void toast.error(t('persona.needName'));
    if (!angle('front')) return void toast.error(t('persona.needFront'));
    await putPersona({
      id: initial?.id ?? uid('pe_'),
      name: name.trim(),
      description: description.trim() || undefined,
      photos,
      createdAt: initial?.createdAt ?? Date.now(),
    });
    await reload();
    onDone();
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('persona.name')} htmlFor="pname">
          <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('persona.namePlaceholder')} autoFocus />
        </Field>
        <Field label={<>{t('persona.about')} <span className="font-normal text-muted-foreground">({t('common.optional')})</span></>} htmlFor="pdesc">
          <Input id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('persona.aboutPlaceholder')} />
        </Field>
      </div>

      <Field label={t('persona.angles')} hint={t('persona.anglesHint')}>
        <div className="grid grid-cols-3 gap-3">
          {ANGLES.map((slot) => (
            <PhotoSlot
              key={slot}
              label={t(`persona.${slot}`)}
              required={slot === 'front'}
              blob={angle(slot)?.blob}
              onSet={(b) => setAngle(slot, b)}
              onClear={() => setPhotos((ps) => ps.filter((p) => p.slot !== slot))}
            />
          ))}
        </div>
      </Field>

      <Field label={t('persona.expressions')} hint={t('persona.expressionsHint')}>
        <div className="space-y-2">
          {expressions.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <Thumb blob={p.blob} className="size-12 shrink-0" />
              <Input
                value={p.expression ?? ''}
                onChange={(e) => setPhotos((ps) => ps.map((x) => (x.id === p.id ? { ...x, expression: e.target.value } : x)))}
                placeholder={t('persona.expressionLabel')}
                className="h-8"
              />
              <Button variant="ghost" size="icon-sm" onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))} aria-label={t('common.remove')}>
                <Trash2 />
              </Button>
            </div>
          ))}
          {photos.length < 8 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                pickFile(async (file) => {
                  const blob = await normaliseUpload(file, 1536);
                  setPhotos((ps) => [...ps, { id: uid('ph_'), slot: 'expression', expression: '', blob }]);
                })
              }
            >
              <ImagePlus /> {t('persona.addExpression')}
            </Button>
          )}
        </div>
      </Field>

      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button onClick={save}>{t('common.save')}</Button>
      </DialogFooter>
    </div>
  );
}

function PersonaCard({ persona, onEdit }: { persona: Persona; onEdit: () => void }) {
  const t = useT();
  const reload = useWorkspace((s) => s.reloadPersonas);
  const front = persona.photos.find((p) => p.slot === 'front') ?? persona.photos[0];
  const url = useBlobUrl(front?.blob);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-lg border p-2">
      {url ? <img src={url} alt="" className="size-12 rounded-md object-cover" /> : <div className="size-12 rounded-md bg-muted" />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{persona.name}</p>
        <p className="truncate text-xs text-muted-foreground">{persona.description || t('persona.photos', { n: persona.photos.length })}</p>
      </div>
      {confirming ? (
        <>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              await deletePersona(persona.id);
              reload();
            }}
          >
            {t('common.delete')}
          </Button>
        </>
      ) : (
        <>
          <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={t('brief.brandEdit')}>
            <Pencil />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setConfirming(true)} aria-label={t('common.delete')}>
            <Trash2 />
          </Button>
        </>
      )}
    </div>
  );
}

export function PersonaDialog() {
  const t = useT();
  const open = useUI((s) => s.dialog === 'personas');
  const close = useUI((s) => s.close);
  const personas = useWorkspace((s) => s.personas);
  const [editing, setEditing] = useState<Persona | 'new' | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          close();
          setEditing(null);
        }
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editing && (
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(null)} aria-label={t('common.back')}>
                <ArrowLeft />
              </Button>
            )}
            {editing === 'new' ? t('persona.new') : editing ? editing.name : t('persona.title')}
          </DialogTitle>
          {!editing && <DialogDescription>{t('persona.description')}</DialogDescription>}
        </DialogHeader>

        {editing ? (
          <Editor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        ) : (
          <div className="space-y-2">
            {personas.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t('persona.empty')}</p>}
            {personas.map((p) => (
              <PersonaCard key={p.id} persona={p} onEdit={() => setEditing(p)} />
            ))}
            <Button className="w-full" variant="outline" onClick={() => setEditing('new')}>
              <Plus /> {t('persona.new')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
