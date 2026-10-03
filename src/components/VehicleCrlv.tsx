import { useState } from 'react';
import { Download, ExternalLink, FileText } from 'lucide-react';
import type { Crlv } from '../domain/crlv';
import { downloadCrlv, errorMessage } from '../lib/api';

export function VehicleCrlv({
  vehicleId,
  plate,
  equipment,
  documents,
  loading,
  failed,
}: {
  vehicleId: number;
  plate: string;
  equipment: boolean;
  documents: Crlv[];
  loading: boolean;
  failed: boolean;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const sorted = [...documents].sort(
    (a, b) => b.ano_documento - a.ano_documento || a.id.localeCompare(b.id),
  );
  const current = sorted.find((doc) => doc.id === selectedId) ?? sorted[0];
  if (loading)
    return (
      <div className="vehicle-crlv crlv-muted" role="status">
        Carregando CRLV…
      </div>
    );
  if (failed) return <div className="vehicle-crlv crlv-muted">Consulta de CRLV indisponível</div>;
  if (!current)
    return (
      <div className="vehicle-crlv crlv-muted">
        <FileText size={16} />
        {equipment ? 'Sem CRLV vinculado' : 'CRLV não disponível'}
      </div>
    );
  const url = `/api/vehicles/${vehicleId}/crlv/${current.id}`;
  return (
    <div className="vehicle-crlv">
      <div className="crlv-heading">
        <FileText size={16} />
        <strong>CRLV {current.ano_documento}</strong>
        {sorted.length > 1 && <span>{sorted.length} documentos</span>}
      </div>
      {sorted.length > 1 && (
        <label className="crlv-version">
          Documento
          <select
            aria-label={`Documento CRLV de ${plate}`}
            value={current.id}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setDownloadError('');
            }}
          >
            {sorted.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.ano_documento} · {doc.placa}
              </option>
            ))}
          </select>
        </label>
      )}
      {current.placa !== plate && (
        <span className="crlv-date">Placa no documento: {current.placa}</span>
      )}
      <div className="crlv-actions">
        <a
          className="button secondary"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visualizar CRLV de ${plate}`}
        >
          <ExternalLink size={15} />
          Visualizar
        </a>
        <button
          className="button secondary"
          type="button"
          disabled={downloading}
          aria-label={`Baixar CRLV de ${plate}`}
          onClick={async () => {
            setDownloading(true);
            setDownloadError('');
            try {
              const blob = await downloadCrlv(vehicleId, current.id);
              const href = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = href;
              anchor.download = `CRLVDigital_${current.placa}_${current.ano_documento}.pdf`;
              document.body.append(anchor);
              anchor.click();
              anchor.remove();
              setTimeout(() => URL.revokeObjectURL(href), 60000);
            } catch (error) {
              setDownloadError(errorMessage(error));
            } finally {
              setDownloading(false);
            }
          }}
        >
          <Download size={15} />
          {downloading ? 'Baixando…' : 'Baixar CRLV'}
        </button>
      </div>
      {downloadError && (
        <span className="crlv-download-error" role="alert">
          {downloadError}
        </span>
      )}
    </div>
  );
}
