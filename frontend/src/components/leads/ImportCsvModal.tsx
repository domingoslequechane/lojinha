import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Users, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ContactLead, KanbanColumn } from '../../types';
import { kanbanService, DEFAULT_STORE_ID } from '../../services/kanbanService';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: KanbanColumn[];
  currentStoreId?: string;
  onSuccess: (newLeads: ContactLead[]) => void;
}

interface ParsedContact {
  name: string;
  phone: string;
  notes?: string;
  dealValue?: number;
  location?: string;
  tags?: string[];
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  columns,
  currentStoreId = DEFAULT_STORE_ID,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState<string>(columns[0]?.id || 'col-new');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{ total: number; success: number } | null>(null);

  const cleanPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return raw;
    if (raw.trim().startsWith('+')) {
      return `+${digits}`;
    }
    // If 9 digits starting with 8 (common in Mozambique 82, 84, 85, 86, 87)
    if (digits.length === 9 && digits.startsWith('8')) {
      return `+258${digits}`;
    }
    // If starts with 258
    if (digits.startsWith('258') && digits.length === 12) {
      return `+${digits}`;
    }
    return `+${digits}`;
  };

  const parseCsvContent = (text: string): ParsedContact[] => {
    // Determine delimiter: comma, semicolon, or tab
    const firstLine = text.split('\n')[0] || '';
    let delimiter = ',';
    if (firstLine.includes(';') && (firstLine.split(';').length > firstLine.split(',').length)) {
      delimiter = ';';
    } else if (firstLine.includes('\t')) {
      delimiter = '\t';
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    const headers = lines[0]
      .split(delimiter)
      .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    let nameIdx = -1;
    let phoneIdx = -1;
    let notesIdx = -1;
    let valIdx = -1;
    let locIdx = -1;

    headers.forEach((h, idx) => {
      if (['nome', 'name', 'cliente', 'contato', 'contact', 'lead'].includes(h)) nameIdx = idx;
      if (['telefone', 'tel', 'phone', 'celular', 'cel', 'whatsapp', 'número', 'numero', 'mobile'].includes(h)) phoneIdx = idx;
      if (['nota', 'notas', 'note', 'notes', 'observação', 'observacao', 'obs'].includes(h)) notesIdx = idx;
      if (['valor', 'deal', 'preço', 'preco', 'price'].includes(h)) valIdx = idx;
      if (['cidade', 'local', 'localização', 'localizacao', 'address', 'endereço', 'endereco'].includes(h)) locIdx = idx;
    });

    const hasHeader = nameIdx !== -1 || phoneIdx !== -1;
    const startIndex = hasHeader ? 1 : 0;

    if (!hasHeader) {
      nameIdx = 0;
      phoneIdx = 1;
      notesIdx = 2;
    }

    const results: ParsedContact[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Split preserving quotes if simple
      const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());

      const name = cols[nameIdx] || `Contato ${i + 1}`;
      const rawPhone = cols[phoneIdx] || '';
      const notes = notesIdx !== -1 ? cols[notesIdx] : undefined;
      const valRaw = valIdx !== -1 ? cols[valIdx] : undefined;
      const location = locIdx !== -1 ? cols[locIdx] : undefined;

      if (!rawPhone && !name) continue;

      const phone = cleanPhone(rawPhone);
      const dealValue = valRaw ? parseFloat(valRaw.replace(/[^0-9.]/g, '')) || 0 : 0;

      results.push({
        name,
        phone: phone || rawPhone || '+258840000000',
        notes: notes || undefined,
        dealValue,
        location,
        tags: ['Importado via CSV'],
      });
    }

    return results;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const contacts = parseCsvContent(text);
        if (contacts.length === 0) {
          setErrorMsg('Nenhum contato válido encontrado no arquivo. Verifique o formato do CSV.');
        } else {
          setParsedContacts(contacts);
        }
      } catch (err) {
        setErrorMsg('Erro ao ler arquivo CSV. Verifique a formatação.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Não foi possível carregar o arquivo selecionado.');
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (parsedContacts.length === 0) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const importedLeads: ContactLead[] = [];
    let count = 0;

    for (const c of parsedContacts) {
      const now = Date.now();
      const leadPayload: Partial<ContactLead> = {
        name: c.name,
        phone: c.phone,
        columnId: selectedColumnId,
        unreadCount: 0,
        lastMessage: c.notes || 'Início de conversa (Importado via CSV)',
        lastMessageTime: 'Agora',
        lastMessageTimestamp: now,
        dealValue: c.dealValue || 0,
        tags: c.tags || ['Importado via CSV'],
        location: c.location,
        followUpNotes: c.notes,
      };

      try {
        const created = await kanbanService.createLead(leadPayload, currentStoreId);
        if (created) {
          importedLeads.push(created);
          count++;
        }
      } catch (err) {
        console.error('Error importing contact:', c, err);
      }
    }

    setIsProcessing(false);
    setImportStats({ total: parsedContacts.length, success: count });

    if (importedLeads.length > 0) {
      onSuccess(importedLeads);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedContacts([]);
    setErrorMsg(null);
    setImportStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-in fade-in">
      <div className="bg-[#091E19] border border-[#235447] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#14382F] border-b border-[#235447] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C1F76B]/15 text-[#C1F76B] border border-[#C1F76B]/30 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#FDFEF8]">Importar Contatos via CSV</h3>
              <p className="text-xs text-[#95BDB0]">
                Migre sua lista de clientes para iniciar conversas na Lojinha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#0F2D26] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {importStats && (
            <div className="p-3 rounded-xl bg-[#C1F76B]/15 border border-[#C1F76B]/30 text-[#C1F76B] text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>
                {importStats.success} de {importStats.total} contatos importados com sucesso! Fechando...
              </span>
            </div>
          )}

          {/* Upload Dropzone */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#2D6B5A] hover:border-[#C1F76B] rounded-2xl p-8 text-center cursor-pointer bg-[#0F2D26]/60 hover:bg-[#14382F]/60 transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-[#14382F] group-hover:bg-[#C1F76B] text-[#95BDB0] group-hover:text-[#0F2D26] flex items-center justify-center transition-all shadow-md">
                <Upload className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#FDFEF8] group-hover:text-[#C1F76B] transition-colors">
                  Clique para selecionar arquivo CSV
                </p>
                <p className="text-xs text-[#95BDB0] mt-1">
                  Formatos aceitos: .csv ou .txt (separados por vírgula ou ponto e vírgula)
                </p>
              </div>
              <div className="mt-2 text-[11px] text-[#95BDB0]/80 bg-[#14382F] px-3 py-1.5 rounded-lg border border-[#235447]">
                Exemplo de colunas: <strong className="text-[#C1F76B]">Nome, Telefone, Nota, Localização</strong>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="p-3 rounded-xl bg-[#14382F] border border-[#235447] flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <FileSpreadsheet className="w-4 h-4 text-[#C1F76B] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#FDFEF8] truncate">{file.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#C1F76B]/15 text-[#C1F76B] font-bold">
                    {parsedContacts.length} contatos
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-[#95BDB0] hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Trocar</span>
                </button>
              </div>

              {/* Target Column Selector */}
              <div>
                <label className="text-xs font-bold text-[#C1F76B] uppercase tracking-wider block mb-1.5">
                  Importar para a Coluna do Kanban:
                </label>
                <select
                  value={selectedColumnId}
                  onChange={(e) => setSelectedColumnId(e.target.value)}
                  className="w-full bg-[#0F2D26] text-xs text-[#FDFEF8] px-3 py-2.5 rounded-xl border border-[#2D6B5A] focus:border-[#C1F76B] focus:outline-none"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview Table */}
              <div>
                <label className="text-xs font-bold text-[#95BDB0] uppercase tracking-wider block mb-1.5">
                  Prévia dos primeiros contatos ({Math.min(5, parsedContacts.length)} de {parsedContacts.length}):
                </label>
                <div className="rounded-xl border border-[#235447] overflow-hidden bg-[#0F2D26]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#14382F] text-[#95BDB0] border-b border-[#235447]">
                      <tr>
                        <th className="py-2 px-3">Nome</th>
                        <th className="py-2 px-3">Telefone</th>
                        <th className="py-2 px-3">Nota / Detalhe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#235447]/60 text-[#D1EAE0]">
                      {parsedContacts.slice(0, 5).map((c, idx) => (
                        <tr key={idx} className="hover:bg-[#14382F]/40">
                          <td className="py-2 px-3 font-medium text-[#FDFEF8] truncate max-w-[140px]">{c.name}</td>
                          <td className="py-2 px-3 text-[#95BDB0] truncate max-w-[120px]">{c.phone}</td>
                          <td className="py-2 px-3 text-[#95BDB0]/80 truncate max-w-[150px]">{c.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0B241D] border-t border-[#235447] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#95BDB0] hover:text-[#FDFEF8] hover:bg-[#14382F] transition-all cursor-pointer"
          >
            Cancelar
          </button>

          {parsedContacts.length > 0 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleImport}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] shadow-md shadow-[#C1F76B]/25 hover:shadow-[#C1F76B]/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0F2D26] border-t-transparent rounded-full animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Importar {parsedContacts.length} Contatos</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
