import { useState, type FormEvent } from 'react';

import { toast } from 'sonner';

import Modal from '../../../../components/ui/Modal';

export interface TemplateSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; description?: string; setActive: boolean }) => Promise<void>;
}

export const TemplateSaveModal = ({ isOpen, onClose, onSubmit }: TemplateSaveModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [setActive, setSetActive] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Укажите название шаблона.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined, setActive });
      toast.success('Шаблон сохранён.');
      setName('');
      setDescription('');
      setSetActive(true);
      onClose();
    } catch {
      toast.error('Не удалось сохранить шаблон.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Сохранить как шаблон">
      <form className="stacked-form" onSubmit={handleSubmit}>
        <label>
          Название шаблона
          <input value={name} onChange={event => setName(event.target.value)} />
        </label>
        <label>
          Описание
          <textarea value={description} onChange={event => setDescription(event.target.value)} rows={2} />
        </label>
        <label className="checkbox-field">
          <input type="checkbox" checked={setActive} onChange={event => setSetActive(event.target.checked)} />
          Сделать активным для модели
        </label>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  );
};
