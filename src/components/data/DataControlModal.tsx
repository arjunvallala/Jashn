'use client';

import React, { useState } from 'react';
import {
  Download,
  Upload,
  Trash2,
  Printer,
  Shield,
  FileJson,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { ValidatedEventPlan } from '@/domain/validators';
import { exportPlanAsJSON, exportPlanAsCSV, exportPlanAsICS, importPlanFromJSON } from '@/lib/export';
import { LocalPlanStorage } from '@/lib/storage';
import { Modal } from '../common/Modal';

interface DataControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ValidatedEventPlan | null;
  onPlanImported: (plan: ValidatedEventPlan) => void;
  onPlanDeleted: () => void;
}

export const DataControlModal: React.FC<DataControlModalProps> = ({
  isOpen,
  onClose,
  plan,
  onPlanImported,
  onPlanDeleted,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const result = await importPlanFromJSON(file);
    if (result.success && result.plan) {
      LocalPlanStorage.save(result.plan);
      onPlanImported(result.plan);
      onClose();
    } else {
      setImportError(result.error || 'Failed to import event plan.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteData = () => {
    LocalPlanStorage.clearAll();
    onPlanDeleted();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Data Control, Export & Privacy">
      <div className="space-y-6">
        {/* Privacy Note */}
        <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-1.5">
          <div className="flex items-center space-x-2 text-foreground font-bold text-sm">
            <Shield className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Local-First Privacy Architecture</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All your event details, budgets, tasks, and vendor information are stored strictly inside your browser’s local storage. Jashn never creates database accounts or sells your personal information. Only anonymized celebration aesthetics and constraints are processed server-side by Gemini.
          </p>
        </div>

        {/* Export Options */}
        {plan && (
          <div>
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-3">
              Export Plan Formats
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => exportPlanAsJSON(plan)}
                className="p-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex flex-col items-center justify-center space-y-1 min-h-touch transition-all shadow-sm"
              >
                <FileJson className="w-5 h-5 text-primary" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={() => exportPlanAsCSV(plan)}
                className="p-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex flex-col items-center justify-center space-y-1 min-h-touch transition-all shadow-sm"
              >
                <FileSpreadsheet className="w-5 h-5 text-success" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => exportPlanAsICS(plan)}
                className="p-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex flex-col items-center justify-center space-y-1 min-h-touch transition-all shadow-sm"
              >
                <Calendar className="w-5 h-5 text-accent" />
                <span>Export ICS</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex flex-col items-center justify-center space-y-1 min-h-touch transition-all shadow-sm"
              >
                <Printer className="w-5 h-5 text-foreground" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Import JSON Plan */}
        <div>
          <label htmlFor="import-plan-file" className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-2">
            Import Saved Plan (JSON)
          </label>
          <input
            id="import-plan-file"
            type="file"
            accept=".json"
            aria-label="Upload JSON plan file"
            onChange={handleFileUpload}
            className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
          />
          {importError && (
            <p className="mt-2 text-xs font-semibold text-destructive flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
              {importError}
            </p>
          )}
        </div>

        {/* Delete All Data */}
        <div className="pt-4 border-t border-border">
          {confirmDelete ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive space-y-3">
              <p className="text-xs font-bold text-destructive">
                Are you sure? This will permanently erase your celebration plan and local settings from this browser.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleDeleteData}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-destructive text-destructive-foreground hover:opacity-90 min-h-touch shadow"
                >
                  Yes, Erase Everything
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted min-h-touch"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center space-x-2 text-xs font-bold text-destructive hover:underline min-h-touch"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All My Data (Zero-Trace Purge)</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
