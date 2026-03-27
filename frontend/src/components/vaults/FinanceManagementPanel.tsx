import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReleaseScheduleItem } from '../../types';

interface FinanceManagementPanelProps {
  vault: {
    id: string;
    name: string;
    current: number;
    target: number;
    releaseSchedule?: ReleaseScheduleItem[];
  };
}

export function FinanceManagementPanel({ vault }: FinanceManagementPanelProps) {
  const [schedule, setSchedule] = useState<ReleaseScheduleItem[]>(
    vault.releaseSchedule || [
      { id: 'r1', percentage: 33, amount: Math.round(vault.target * 0.33), date: '', released: false, label: 'Primer tramo' },
      { id: 'r2', percentage: 33, amount: Math.round(vault.target * 0.33), date: '', released: false, label: 'Segundo tramo' },
      { id: 'r3', percentage: 34, amount: Math.round(vault.target * 0.34), date: '', released: false, label: 'Tramo final' },
    ]
  );
  const [isEditing, setIsEditing] = useState(!vault.releaseSchedule);

  const totalPercentage = schedule.reduce((sum, s) => sum + s.percentage, 0);
  const isValid = totalPercentage === 100 && schedule.every(s => s.percentage > 0);

  const updatePercentage = (id: string, newPct: number) => {
    setSchedule(prev => prev.map(s => 
      s.id === id 
        ? { ...s, percentage: newPct, amount: Math.round(vault.target * (newPct / 100)) }
        : s
    ));
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: 'FILL 1' }}>account_balance</span>
          <h4 className="text-white font-bold text-sm">Liberaciones Programadas</h4>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-bold text-primary hover:text-secondary transition-colors"
        >
          {isEditing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {/* Percentage Ring Summary */}
      <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-on-surface-variant/60 text-xs">Distribución del vault</span>
          <span className={`text-xs font-bold ${totalPercentage === 100 ? 'text-primary' : 'text-error'}`}>
            {totalPercentage}% asignado
          </span>
        </div>
        
        {/* Visual percentage bar */}
        <div className="h-4 rounded-full bg-surface-variant/50 overflow-hidden flex">
          {schedule.map((s, i) => {
            const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary'];
            return (
              <motion.div
                key={s.id}
                initial={{ width: 0 }}
                animate={{ width: `${s.percentage}%` }}
                transition={{ delay: i * 0.1 }}
                className={`h-full ${colors[i % colors.length]} ${i === 0 ? 'rounded-l-full' : ''} ${i === schedule.length - 1 ? 'rounded-r-full' : ''}`}
              />
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mt-3">
          {schedule.map((s, i) => {
            const colors = ['text-primary', 'text-secondary', 'text-tertiary'];
            const bgColors = ['bg-primary', 'bg-secondary', 'bg-tertiary'];
            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${bgColors[i % bgColors.length]}`} />
                <span className={`text-[10px] font-semibold ${colors[i % colors.length]}`}>{s.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {schedule.map((item, index) => {
          const colors = ['border-primary/30 bg-primary/5', 'border-secondary/30 bg-secondary/5', 'border-tertiary/30 bg-tertiary/5'];
          const textColors = ['text-primary', 'text-secondary', 'text-tertiary'];
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl p-4 border ${colors[index % colors.length]} relative`}
            >
              {/* Timeline connector */}
              {index < schedule.length - 1 && (
                <div className="absolute left-7 top-full w-0.5 h-3 bg-outline-variant/30 z-10" />
              )}

              <div className="flex items-start gap-3">
                {/* Step indicator */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.released ? 'bg-primary/20' : 'bg-surface-container'
                }`}>
                  {item.released ? (
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: 'FILL 1' }}>check</span>
                  ) : (
                    <span className={`text-sm font-bold ${textColors[index % textColors.length]}`}>{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    {item.released && (
                      <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">Liberado</span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-3">
                        <label className="text-on-surface-variant/60 text-[10px] font-bold uppercase w-12">%</label>
                        <input
                          type="range"
                          min={5}
                          max={80}
                          value={item.percentage}
                          onChange={(e) => updatePercentage(item.id, parseInt(e.target.value))}
                          className="flex-1 accent-primary h-1.5 bg-surface-variant rounded-full appearance-none cursor-pointer"
                        />
                        <span className={`text-sm font-bold w-10 text-right ${textColors[index % textColors.length]}`}>
                          {item.percentage}%
                        </span>
                      </div>
                      <p className="text-on-surface-variant/50 text-xs">
                        Monto: <span className="text-white font-semibold">${item.amount.toLocaleString()} DOC</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-on-surface-variant/60 text-xs">
                        {item.percentage}% · ${item.amount.toLocaleString()} DOC
                      </span>
                      {item.date && (
                        <span className="text-on-surface-variant/50 text-xs">
                          {new Date(item.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total Summary */}
      <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20">
        <div className="flex justify-between items-center">
          <span className="text-on-surface-variant/60 text-xs">Total del vault</span>
          <span className="text-white font-bold">${vault.target.toLocaleString()} DOC</span>
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleSave}
          disabled={!isValid}
          className={`w-full py-3 rounded-2xl font-headline font-bold uppercase text-sm transition-all ${
            isValid
              ? 'bg-primary text-on-primary active:scale-[0.98]'
              : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
          }`}
        >
          {totalPercentage !== 100 ? `Ajustar (${totalPercentage}% / 100%)` : 'Guardar Distribución'}
        </motion.button>
      )}
    </div>
  );
}
