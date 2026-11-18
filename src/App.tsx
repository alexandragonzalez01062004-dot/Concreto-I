import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  Minus,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  BeamInputs,
  CalcMode,
  CLASS_DEFAULT_INPUTS,
  REBAR_CATALOG,
  calculateBeam,
  computeAutoDimensions,
} from './utils/beamCalculator';
import { StructuralDiagrams } from './components/StructuralDiagrams';
import { CalculationMemory } from './components/CalculationMemory';
import { ExecutiveSummarySection } from './components/ExecutiveSummarySection';

interface NumberFieldProps {
  id: string;
  label: string;
  unit: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
}

const NumberField: React.FC<NumberFieldProps> = ({
  id,
  label,
  unit,
  value,
  min = 0,
  max,
  step = 1,
  onChange,
}) => {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <label htmlFor={id} className="text-xs font-medium text-[#2D3748]">
          {label}
        </label>
        <span className="text-[11px] font-mono text-[#64748B]">{unit}</span>
      </div>
      <input
        id={id}
        type="number"
        value={Number.isNaN(value) ? '' : value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          onChange(Number.isNaN(parsed) ? 0 : parsed);
        }}
        className="w-full px-3 py-2 text-sm font-mono tabular-nums text-[#2D3748] bg-[#FDFBF7] border border-[#DCEBF2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8D8EA] focus:border-[#2D3748] transition-colors"
      />
    </div>
  );
};

export function App() {
  const [inputs, setInputs] = useState<BeamInputs>(CLASS_DEFAULT_INPUTS);

  const results = useMemo(() => calculateBeam(inputs), [inputs]);

  const updateInput = <K extends keyof BeamInputs>(key: K, value: BeamInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleModeChange = (nextMode: CalcMode) => {
    if (nextMode === inputs.mode) return;
    if (nextMode === 'verify') {
      // Precargar el modo verificación con los valores calculados actualmente para continuidad inmediata
      setInputs((prev) => ({
        ...prev,
        mode: 'verify',
        verifyH: Math.round(results.h),
        verifyB: Math.round(results.b),
        verifyBarId: results.bar.id,
        verifyNumBars: results.numBars,
      }));
    } else {
      setInputs((prev) => ({
        ...prev,
        mode: 'design',
      }));
    }
  };

  const handleToggleManualDims = (checked: boolean) => {
    if (checked) {
      const auto = computeAutoDimensions(inputs.L);
      setInputs((prev) => ({
        ...prev,
        manualDims: true,
        manualH: auto.hAuto,
        manualB: auto.bAuto,
      }));
    } else {
      setInputs((prev) => ({ ...prev, manualDims: false }));
    }
  };

  const handleResetClassData = () => {
    setInputs(CLASS_DEFAULT_INPUTS);
  };

  const handlePrint = () => {
    window.print();
  };

  const fmt = (n: number, dec = 2) =>
    Number.isFinite(n) ? n.toFixed(dec) : '—';

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D3748] flex flex-col">
      {/* Encabezado Académico Principal */}
      <header className="bg-white border-b border-[#E8E3DA] print-card">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#64748B]">
                <span className="font-semibold text-[#2D3748]">Curso: Concreto I</span>
                <span aria-hidden="true">·</span>
                <span>Normativa: ACI 318-19 (Sistema Internacional: mm, m, MPa, kN, kN·m)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D3748] text-balance">
                Calculadora de Vigas Rectangulares de Concreto Reforzado a Flexión
              </h1>
              <p className="text-xs sm:text-sm text-[#475569]">
                <span className="font-semibold text-[#2D3748]">Autores:</span>{' '}
                Analy Alexandra González Rodas · Helen Esperanza Alonzo de León · Asbel Carmine Salvatore Pu Rodas
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 no-print">
              <button
                type="button"
                onClick={handleResetClassData}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2D3748] bg-[#FDFBF7] border border-[#DCEBF2] rounded-lg hover:bg-[#A8D8EA]/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Cargar Datos de Clase
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2D3748] bg-[#A8D8EA] border border-[#7BBCD6] rounded-lg hover:bg-[#93CDE3] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                Imprimir / Guardar Memoria en PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Resumen de Datos de Entrada visible únicamente en impresión PDF */}
        <section className="hidden print-only mb-6 p-4 border border-[#CBD5E1] rounded-lg bg-white print-break-inside-avoid">
          <h2 className="text-sm font-bold text-[#2D3748] mb-2">
            Parámetros de Entrada del Problema
          </h2>
          <div className="grid grid-cols-4 gap-3 text-xs font-mono tabular-nums">
            <div>
              <span className="text-[#64748B] font-sans block">Luz del claro (L):</span>
              <strong>{fmt(inputs.L)} m</strong>
            </div>
            <div>
              <span className="text-[#64748B] font-sans block">Sección (b × h):</span>
              <strong>
                {Math.round(results.b)} × {Math.round(results.h)} mm
              </strong>
            </div>
            <div>
              <span className="text-[#64748B] font-sans block">Materiales (f&apos;c / fy):</span>
              <strong>
                {inputs.fc} / {inputs.fy} MPa
              </strong>
            </div>
            <div>
              <span className="text-[#64748B] font-sans block">Peso específico (γc):</span>
              <strong>{inputs.gammaC} kN/m³</strong>
            </div>
            <div>
              <span className="text-[#64748B] font-sans block">Carga muerta adic.:</span>
              <strong>{fmt(inputs.wDeadAdd)} kN/m</strong>
            </div>
            <div>
              <span className="text-[#64748B] font-sans block">Carga viva (WL):</span>
              <strong>{fmt(inputs.wLive)} kN/m</strong>
            </div>
            <div>
              <span className="text-[#64748B] font-sans block">Recubr. / Estribo:</span>
              <strong>
                {inputs.cover} mm / Ø{inputs.stirrupDia} mm
              </strong>
            </div>
            <div>
              <span className="text-[#64748B] font-sans block">Acero longitudinal:</span>
              <strong>
                {results.numBars} Var. {results.bar.label} (Ab={results.bar.Ab} mm²)
              </strong>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row items-start gap-6 print-full-width">
          {/* Columna Izquierda: Panel de Entrada Dinámico */}
          <aside className="w-full lg:w-[380px] shrink-0 space-y-5 no-print">
            <div className="bg-white border border-[#E8E3DA] rounded-xl p-5 space-y-5">
              {/* Selector de Modalidad */}
              <div>
                <span className="block text-xs font-semibold text-[#64748B] mb-2">
                  Modalidad de Análisis
                </span>
                <div
                  className="grid grid-cols-2 gap-1 p-1 bg-[#FDFBF7] border border-[#E8E3DA] rounded-lg"
                  role="tablist"
                  aria-label="Modalidad de cálculo"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputs.mode === 'design'}
                    onClick={() => handleModeChange('design')}
                    className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      inputs.mode === 'design'
                        ? 'bg-[#A8D8EA] text-[#2D3748]'
                        : 'text-[#64748B] hover:text-[#2D3748]'
                    }`}
                  >
                    Modo Diseño
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputs.mode === 'verify'}
                    onClick={() => handleModeChange('verify')}
                    className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      inputs.mode === 'verify'
                        ? 'bg-[#E0BBE4] text-[#2D3748]'
                        : 'text-[#64748B] hover:text-[#2D3748]'
                    }`}
                  >
                    Modo Verificación
                  </button>
                </div>
                <p className="text-[11px] text-[#64748B] mt-2 leading-relaxed">
                  {inputs.mode === 'design'
                    ? 'Diseño 100% automático: predimensiona b × h, selecciona el calibre comercial óptimo (No. 3 a No. 10) y propone el número de barras.'
                    : 'Ingresa manualmente dimensiones b × h, calibre de varilla y cantidad fija de barras (n) para evaluar una sección existente.'}
                </p>
              </div>

              <hr className="border-[#E8E3DA]" />

              {/* Bloque 1: Claro y Dimensiones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#2D3748]">
                    {inputs.mode === 'design'
                      ? 'Claro y Predimensionamiento'
                      : 'Claro y Dimensiones de Sección'}
                  </h2>
                  <SlidersHorizontal className="w-4 h-4 text-[#64748B]" aria-hidden="true" />
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <label htmlFor="input-L" className="text-xs font-medium text-[#2D3748]">
                      Luz del claro (L)
                    </label>
                    <span className="font-mono tabular-nums text-xs font-semibold text-[#2D3748]">
                      {fmt(inputs.L)} m
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2.0}
                      max={12.0}
                      step={0.25}
                      value={inputs.L}
                      onChange={(e) => updateInput('L', parseFloat(e.target.value))}
                      aria-label="Control deslizante de luz del claro en metros"
                      className="pastel-slider flex-1"
                    />
                    <input
                      id="input-L"
                      type="number"
                      min={0.5}
                      max={25}
                      step={0.1}
                      value={inputs.L}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        updateInput('L', Number.isNaN(v) ? 1 : v);
                      }}
                      className="w-20 px-2.5 py-1.5 text-sm font-mono tabular-nums text-[#2D3748] bg-[#FDFBF7] border border-[#DCEBF2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8D8EA]"
                    />
                  </div>
                </div>

                {inputs.mode === 'design' ? (
                  <div className="p-3 rounded-lg bg-[#FDFBF7] border border-[#DCEBF2] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">h mínimo (L / 16):</span>
                      <span className="font-mono tabular-nums font-semibold text-[#2D3748]">
                        {fmt(results.hMin, 1)} mm
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">Sección calculada (b × h):</span>
                      <span className="font-mono tabular-nums font-bold text-[#2D3748]">
                        {Math.round(results.b)} × {Math.round(results.h)} mm
                      </span>
                    </div>

                    <label className="flex items-center gap-2 pt-1.5 border-t border-[#E8E3DA] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={inputs.manualDims}
                        onChange={(e) => handleToggleManualDims(e.target.checked)}
                        className="w-4 h-4 rounded border-[#CBD5E1] accent-[#2D3748]"
                      />
                      <span className="text-xs font-medium text-[#2D3748]">
                        Sobrescribir h y b manualmente (opcional)
                      </span>
                    </label>

                    {inputs.manualDims && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <NumberField
                          id="input-manual-b"
                          label="Ancho (b)"
                          unit="mm"
                          value={inputs.manualB}
                          min={120}
                          step={25}
                          onChange={(v) => updateInput('manualB', v)}
                        />
                        <NumberField
                          id="input-manual-h"
                          label="Altura (h)"
                          unit="mm"
                          value={inputs.manualH}
                          min={150}
                          step={25}
                          onChange={(v) => updateInput('manualH', v)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-[#E0BBE4]/20 border border-[#E0BBE4] space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField
                        id="input-verify-b"
                        label="Ancho (b)"
                        unit="mm"
                        value={inputs.verifyB}
                        min={120}
                        step={25}
                        onChange={(v) => updateInput('verifyB', v)}
                      />
                      <NumberField
                        id="input-verify-h"
                        label="Altura (h)"
                        unit="mm"
                        value={inputs.verifyH}
                        min={150}
                        step={25}
                        onChange={(v) => updateInput('verifyH', v)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-[#E8E3DA]" />

              {/* Bloque 2: Materiales y Cargas */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[#2D3748]">
                  Materiales y Cargas de Servicio
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    id="input-fc"
                    label="Concreto (f'c)"
                    unit="MPa"
                    value={inputs.fc}
                    min={17}
                    max={70}
                    step={1}
                    onChange={(v) => updateInput('fc', v)}
                  />
                  <NumberField
                    id="input-fy"
                    label="Acero (fy)"
                    unit="MPa"
                    value={inputs.fy}
                    min={240}
                    max={550}
                    step={10}
                    onChange={(v) => updateInput('fy', v)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    id="input-gamma"
                    label="Peso esp. (γc)"
                    unit="kN/m³"
                    value={inputs.gammaC}
                    min={15}
                    max={30}
                    step={0.5}
                    onChange={(v) => updateInput('gammaC', v)}
                  />
                  <NumberField
                    id="input-wd"
                    label="Muerta adic."
                    unit="kN/m"
                    value={inputs.wDeadAdd}
                    min={0}
                    step={0.5}
                    onChange={(v) => updateInput('wDeadAdd', v)}
                  />
                </div>

                <NumberField
                  id="input-wl"
                  label="Carga viva (WL)"
                  unit="kN/m"
                  value={inputs.wLive}
                  min={0}
                  step={0.5}
                  onChange={(v) => updateInput('wLive', v)}
                />
              </div>

              <hr className="border-[#E8E3DA]" />

              {/* Bloque 3: Recubrimiento y Refuerzo */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[#2D3748]">
                  Recubrimiento y Refuerzo
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    id="input-cover"
                    label="Recubrimiento (r)"
                    unit="mm"
                    value={inputs.cover}
                    min={15}
                    max={100}
                    step={5}
                    onChange={(v) => updateInput('cover', v)}
                  />
                  <NumberField
                    id="input-stirrup"
                    label="Estribo (de)"
                    unit="mm"
                    value={inputs.stirrupDia}
                    min={6}
                    max={20}
                    step={0.5}
                    onChange={(v) => updateInput('stirrupDia', v)}
                  />
                </div>

                {inputs.mode === 'design' ? (
                  <div className="p-3.5 rounded-lg bg-[#A8D8EA]/25 border border-[#8AC4DA] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D3748]">
                      <Sparkles className="w-3.5 h-3.5 text-[#1E3A5F]" aria-hidden="true" />
                      Varilla Seleccionada Automáticamente
                    </div>
                    <div className="font-mono tabular-nums text-sm font-bold text-[#2D3748]">
                      {results.numBars} Varillas {results.bar.label} ({results.bar.imperial})
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-[#475569]">
                      db = {results.bar.db.toFixed(2)} mm · Ab = {results.bar.Ab} mm² · As,prov ={' '}
                      {fmt(results.AsProv, 0)} mm²
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="select-bar"
                        className="block text-xs font-medium text-[#2D3748] mb-1"
                      >
                        Varilla Longitudinal Comercial
                      </label>
                      <select
                        id="select-bar"
                        value={inputs.verifyBarId}
                        onChange={(e) => updateInput('verifyBarId', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono text-[#2D3748] bg-[#FDFBF7] border border-[#DCEBF2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E0BBE4]"
                      >
                        {REBAR_CATALOG.map((bar) => (
                          <option key={bar.id} value={bar.id}>
                            {bar.label} ({bar.imperial}) — db = {bar.db.toFixed(2)} mm · Ab ={' '}
                            {bar.Ab} mm²
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 rounded-lg bg-[#E0BBE4]/25 border border-[#E0BBE4]">
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="input-num-bars"
                          className="text-xs font-semibold text-[#2D3748]"
                        >
                          Número fijo de barras (n)
                        </label>
                        <span className="font-mono text-xs text-[#475569]">
                          As = {(inputs.verifyNumBars * results.bar.Ab).toFixed(0)} mm²
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateInput('verifyNumBars', Math.max(1, inputs.verifyNumBars - 1))
                          }
                          aria-label="Disminuir número de barras"
                          className="p-2 rounded-lg bg-white border border-[#DCEBF2] hover:bg-[#FDFBF7] text-[#2D3748] cursor-pointer"
                        >
                          <Minus className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <input
                          id="input-num-bars"
                          type="number"
                          min={1}
                          max={20}
                          step={1}
                          value={inputs.verifyNumBars}
                          onChange={(e) =>
                            updateInput(
                              'verifyNumBars',
                              Math.max(1, parseInt(e.target.value || '1', 10))
                            )
                          }
                          className="flex-1 text-center px-3 py-1.5 text-sm font-mono tabular-nums font-semibold bg-white border border-[#DCEBF2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E0BBE4]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateInput('verifyNumBars', Math.min(20, inputs.verifyNumBars + 1))
                          }
                          aria-label="Aumentar número de barras"
                          className="p-2 rounded-lg bg-white border border-[#DCEBF2] hover:bg-[#FDFBF7] text-[#2D3748] cursor-pointer"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Columna Derecha: Resultados, Gráficos SVG y Memoria */}
          <div className="flex-1 min-w-0 space-y-6 w-full">
            {/* Tarjetas KPI de Resumen Ejecutivo */}
            <section
              aria-label="Resumen ejecutivo de resultados"
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print-break-inside-avoid"
            >
              {/* KPI 1: Solicitación Última */}
              <div className="bg-white border border-[#E8E3DA] rounded-xl p-4 print-card">
                <span className="text-xs font-medium text-[#64748B] block">
                  Momento Último (M<sub>u</sub>)
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tabular-nums text-[#2D3748]">
                    {fmt(results.Mu)}
                  </span>
                  <span className="text-xs font-mono text-[#64748B]">kN·m</span>
                </div>
                <p className="mt-1.5 text-xs font-mono tabular-nums text-[#64748B]">
                  W<sub>u</sub> = {fmt(results.wU)} kN/m · V<sub>máx</sub> ={' '}
                  {fmt(results.reaction)} kN
                </p>
              </div>

              {/* KPI 2: Refuerzo Propuesto */}
              <div className="bg-white border border-[#E8E3DA] rounded-xl p-4 print-card">
                <span className="text-xs font-medium text-[#64748B] block">
                  {inputs.mode === 'design'
                    ? 'Armado Propuesto Automático'
                    : 'Armado Evaluado'}
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tabular-nums text-[#2D3748]">
                    {results.numBars} {results.bar.label}
                  </span>
                  <span className="text-xs font-mono text-[#64748B]">
                    ({fmt(results.AsProv, 0)} mm²)
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-mono tabular-nums text-[#64748B]">
                  A<sub>s,req</sub> = {fmt(results.AsReq)} · A<sub>s,min</sub> ={' '}
                  {fmt(results.AsMin)} mm²
                </p>
              </div>

              {/* KPI 3: Resistencia y Ductilidad */}
              <div className="bg-white border border-[#E8E3DA] rounded-xl p-4 print-card">
                <span className="text-xs font-medium text-[#64748B] block">
                  Resistencia de Diseño (φM<sub>n</sub>)
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tabular-nums text-[#2D3748]">
                    {fmt(results.phiMn)}
                  </span>
                  <span className="text-xs font-mono text-[#64748B]">kN·m</span>
                </div>
                <p className="mt-1.5 text-xs font-mono tabular-nums text-[#64748B]">
                  φ = {results.phi.toFixed(2)} · ε<sub>t</sub> = {results.epsilonT.toFixed(4)}
                </p>
              </div>

              {/* KPI 4: Verificación y Eficiencia */}
              <div
                className={`border rounded-xl p-4 print-card ${
                  results.cumpleGlobal
                    ? 'bg-[#C1E1C1]/35 border-[#9AC79A]'
                    : 'bg-[#FFB7B2]/35 border-[#E89892]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#2D3748]">
                    Verificación Global
                  </span>
                  {results.cumpleGlobal ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E4D2B]">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      CUMPLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#7A1F1F]">
                      <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                      NO CUMPLE
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tabular-nums text-[#2D3748]">
                    {fmt(results.utilizationPct, 1)}%
                  </span>
                  <span className="text-xs font-mono text-[#475569]">capacidad</span>
                </div>
                <p className="mt-1.5 text-xs text-[#2D3748]">
                  {results.cumpleFlexion && results.cumpleDuctility && results.cumpleAsMin
                    ? 'Resistencia, cuantía y ductilidad conformes.'
                    : !results.cumpleFlexion
                      ? 'φMn < Mu: aumentar acero o sección.'
                      : !results.cumpleDuctility
                        ? 'εt < 0.005: ductilidad insuficiente.'
                        : 'Acero provisto menor al mínimo ACI.'}
                </p>
              </div>
            </section>

            {/* Diagramas Vectoriales Dinámicos en SVG */}
            <StructuralDiagrams inputs={inputs} results={results} />

            {/* Memoria de Cálculo Paso a Paso */}
            <CalculationMemory inputs={inputs} results={results} />

            {/* Sección Final Obligatoria: Resumen Ejecutivo, Conclusión e Interpretación */}
            <ExecutiveSummarySection inputs={inputs} results={results} />
          </div>
        </div>
      </main>

      {/* Pie de Página Académico (Pantalla e Impresión PDF) */}
      <footer className="bg-white border-t border-[#E8E3DA] mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#475569]">
          <div>
            <strong className="text-[#2D3748]">Curso: Concreto I</strong> · Normativa ACI 318-19
            (SI) · Vigas Rectangulares Simplemente Reforzadas
          </div>
          <div>
            <strong className="text-[#2D3748]">Autores:</strong> Analy Alexandra González Rodas ·
            Helen Esperanza Alonzo de León · Asbel Carmine Salvatore Pu Rodas
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
