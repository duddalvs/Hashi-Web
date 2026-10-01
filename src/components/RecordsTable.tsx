import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2, ArrowDownWideNarrow } from 'lucide-react';
import type { HistoryItem } from '../domain/models';
import type { Row } from '../domain/filters';
import { dateLabel, money, timeLabel } from '../domain/rules';
import { Empty } from './ui';
export type RecordActions = {
  onView: (i: HistoryItem) => void;
  onEdit: (i: HistoryItem) => void;
  onDelete: (i: HistoryItem) => void;
  admin: boolean;
};
export function RecordsTable({
  rows,
  type = 'registro',
  ...actions
}: RecordActions & { rows: Row[]; type?: 'registro' | 'manutencao' | 'todos' }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(15);
  const [ascending, setAscending] = useState(false);
  useEffect(() => setPage(1), [rows, size]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages);
  const ordered = ascending ? [...rows].reverse() : rows;
  const visible = ordered.slice((current - 1) * size, current * size);
  if (!rows.length) return <Empty />;
  return (
    <div className="table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>
                <button className="table-sort" onClick={() => setAscending(!ascending)}>
                  Data <ArrowDownWideNarrow size={13} />
                </button>
              </th>
              {type === 'todos' && <th>Categoria</th>}
              <th>Contrato</th>
              {type === 'registro' && <th>Equipe</th>}
              <th>{type === 'registro' ? 'Responsável / motorista' : 'Motorista'}</th>
              <th>Veículo</th>
              {type !== 'registro' && (
                <>
                  <th>Serviço</th>
                  <th className="align-right">Valor</th>
                </>
              )}
              <th>Enviado em</th>
              <th className="align-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ item, detail, key }) => (
              <tr key={key}>
                <td className="date-cell">{dateLabel(item.data)}</td>
                {type === 'todos' && (
                  <td>
                    <span className={`badge ${item.tipo === 'registro' ? 'blue' : 'amber'}`}>
                      {item.tipo === 'registro' ? 'Equipe' : 'Manutenção'}
                    </span>
                  </td>
                )}
                <td>
                  <span className="contract-cell">
                    <span className="contract-dot" />
                    {item.contrato}
                  </span>
                </td>
                {type === 'registro' && (
                  <td>
                    <span className="team-cell">{String(detail.equipe ?? 1).padStart(2, '0')}</span>
                  </td>
                )}
                <td>
                  {detail.responsavel ? (
                    <span className="person-cell">
                      <span className="mini-avatar">
                        {detail.responsavel
                          .split(' ')
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                      {detail.responsavel}
                    </span>
                  ) : (
                    <span className="muted-text">Não identificado</span>
                  )}
                </td>
                <td>
                  <span className="plate">{detail.placa}</span>
                  <small className="model-cell">{detail.modelo}</small>
                </td>
                {type !== 'registro' && (
                  <>
                    <td>
                      {detail.servico ?? '—'}
                      {detail.observacao && (
                        <small className="model-cell">{detail.observacao}</small>
                      )}
                    </td>
                    <td className="align-right cost-cell">
                      {item.custo === null ? '—' : money(item.custo)}
                    </td>
                  </>
                )}
                <td className="muted-text timestamp">{timeLabel(item.created_at)}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      onClick={() => actions.onView(item)}
                      aria-label="Ver detalhes"
                      title="Ver detalhes"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => actions.onEdit(item)}
                      aria-label="Editar envio"
                      title="Editar envio"
                    >
                      <Pencil size={15} />
                    </button>
                    {actions.admin && (
                      <button
                        className="icon-button delete-action"
                        onClick={() => actions.onDelete(item)}
                        aria-label="Excluir envio"
                        title="Excluir envio"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <span>
          Exibindo{' '}
          <strong>
            {(current - 1) * size + 1}–{Math.min(current * size, rows.length)}
          </strong>{' '}
          de <strong>{rows.length}</strong> {type === 'registro' ? 'equipes' : 'itens'}
        </span>
        <div>
          <label>
            Linhas por página{' '}
            <select
              aria-label="Linhas por página"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            >
              <option>15</option>
              <option>30</option>
              <option>50</option>
            </select>
          </label>
          <span>
            {current} de {pages}
          </span>
          <button
            className="icon-button"
            aria-label="Página anterior"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Próxima página"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
