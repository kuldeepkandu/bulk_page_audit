'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CiDesktop, CiMobile3 } from 'react-icons/ci'
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io'
import { MdOutlineUploadFile } from 'react-icons/md'
import { RiDeleteBin6Line } from 'react-icons/ri'

// ─── constants ───────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Scores: higher = better   CWV: lower = better
const SCORE_METRICS = ['performance', 'seo', 'accessibility', 'bestpractices']
const CWV_METRICS   = ['lcp', 'cls', 'inp', 'fcp', 'tbt']
const ALL_METRICS   = [...SCORE_METRICS, ...CWV_METRICS]

const DISPLAY_LABELS = {
  performance:   'Performance',
  seo:           'SEO',
  accessibility: 'Accessibility',
  bestpractices: 'Best Practices',
  lcp:           'LCP',
  cls:           'CLS',
  inp:           'INP',
  fcp:           'FCP',
  tbt:           'TBT',
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const normKey    = (url, dt) => `${String(url).trim()}||${String(dt).trim().toLowerCase()}`

// ─── colour utilities ─────────────────────────────────────────────────────────
function getScoreColor(v) {
  if (v == null) return 'text-gray-500'
  if (v < 50)   return 'text-red-500    bg-red-100    border rounded-full py-1 px-[5px] font-semibold'
  if (v < 90)   return 'text-orange-500 bg-orange-100 border rounded-full py-1 px-[5px] font-semibold'
  return               'text-green-500  bg-green-100  border rounded-full py-1 px-[5px] font-semibold'
}

function getCwvColor(m, v) {
  if (v == null || isNaN(v)) return 'text-gray-500'
  const n = Number(v)
  const [g, o, r] = ['text-green-600 font-semibold', 'text-orange-500 font-semibold', 'text-red-500 font-semibold']
  switch (m) {
    case 'lcp': return n <= 2.5  ? g : n <= 4    ? o : r
    case 'fcp': return n <= 1.8  ? g : n <= 3    ? o : r
    case 'inp': return n <= 0.2  ? g : n <= 0.5  ? o : r
    case 'tbt': return n <= 0.2  ? g : n <= 0.6  ? o : r
    case 'cls': return n <= 0.1  ? g : n <= 0.25 ? o : r
    default:    return 'text-gray-500'
  }
}

function getDeltaStyle(m, delta) {
  if (delta === null || delta === 0) return { color: 'text-gray-400', icon: null }
  const higherIsBetter = SCORE_METRICS.includes(m)
  const isGood = higherIsBetter ? delta > 0 : delta < 0
  return { color: isGood ? 'text-green-600' : 'text-red-500', icon: delta > 0 ? 'up' : 'down' }
}

function fmtDelta(delta) {
  if (delta === null) return '—'
  if (delta === 0)    return '0'
  return delta > 0 ? `+${delta}` : `${delta}`
}

// ─── drop zone ────────────────────────────────────────────────────────────────
function DropZone({ label, file, onFile }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)
  const handle = (f) => { if (f?.name?.endsWith('.csv')) onFile(f) }
  return (
    <div
      onDragOver={(e)  => { e.preventDefault(); setDrag(true)  }}
      onDragLeave={()  => setDrag(false)}
      onDrop={(e)      => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      onClick={()      => ref.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition
        ${drag ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-teal-400 bg-white'}`}
    >
      <input ref={ref} type="file" accept=".csv" className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
        onClick={(e)  => (e.target.value = '')} />
      <MdOutlineUploadFile className="text-4xl text-teal-400" />
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      {file
        ? <p className="text-xs text-green-600 font-medium">✓ {file.name}</p>
        : <p className="text-xs text-gray-400">Click or drag &amp; drop a .csv</p>}
    </div>
  )
}

// ─── device toggle ────────────────────────────────────────────────────────────
function DeviceToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
      {[
        { label: 'Mobile', icon: CiMobile3, val: 'mobile' },
        { label: 'Desktop', icon: CiDesktop, val: 'desktop' },
        { label: 'All', icon: null, val: 'all' },
      ].map(({ label, icon: Icon, val }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`flex items-center gap-1 px-3 py-2 rounded-md font-semibold transition
            ${value === val
              ? 'bg-teal-600 text-white'
              : 'text-gray-600 hover:text-gray-900'}`}
        >
          {Icon && <Icon className="text-lg" />}
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── device badge ────────────────────────────────────────────────────────────
function DeviceBadge({ deviceType }) {
  const isMobile = deviceType === 'mobile'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
        ${isMobile
          ? 'bg-blue-100 text-blue-700'
          : 'bg-purple-100 text-purple-700'}`}
    >
      {isMobile ? <CiMobile3 className="text-sm" /> : <CiDesktop className="text-sm" />}
      {deviceType}
    </span>
  )
}

function MetricValue({ metric, value }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 text-xs">—</span>
  }

  if (SCORE_METRICS.includes(metric)) {
    return <span className={getScoreColor(value)}>{Math.round(value)}</span>
  }

  return (
    <span className={`text-xs font-medium ${getCwvColor(metric, value)}`}>
      {value}{metric === 'cls' ? '' : 's'}
    </span>
  )
}

// ─── compare table ────────────────────────────────────────────────────────────
function CompareTable({ data, deviceFilter }) {
  const filtered = deviceFilter === 'all'
    ? data
    : data.filter((d) => d.deviceType === deviceFilter)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Link</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Device</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">Type</th>
              {ALL_METRICS.map((m) => (
                <th key={m} className="px-3 py-3 text-center font-semibold text-gray-700 whitespace-nowrap">
                  {DISPLAY_LABELS[m]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3 + ALL_METRICS.length} className="px-4 py-6 text-center text-gray-500">
                  No data for selected device type
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const rowKey = normKey(item.url, item.deviceType)
                const beforeBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                const afterBg = idx % 2 === 0 ? 'bg-teal-50/40' : 'bg-teal-50/70'
                return (
                  <Fragment key={rowKey}>
                    <tr className={`border-b border-gray-100 ${beforeBg}`}>
                      <td rowSpan={2} className="px-4 py-3 align-top border-r border-gray-100 min-w-[280px]">
                        <Link
                          href={item.url}
                          target="_blank"
                          className="text-teal-600 hover:underline font-medium break-all"
                          title={item.url}
                        >
                          {item.url}
                        </Link>
                      </td>
                      <td rowSpan={2} className="px-4 py-3 align-top text-center border-r border-gray-100">
                        <DeviceBadge deviceType={item.deviceType} />
                      </td>
                      <td className="px-4 py-3 text-center border-r border-gray-100">
                        <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-700 px-2.5 py-1 text-xs font-semibold">
                          Before
                        </span>
                      </td>
                      {ALL_METRICS.map((m) => {
                        const { before } = item.metrics[m] ?? {}
                        return (
                          <td key={`before-${m}`} className="px-3 py-3 text-center">
                            <MetricValue metric={m} value={before} />
                          </td>
                        )
                      })}
                    </tr>
                    <tr className={`border-b ${afterBg}`}>
                      <td className="px-4 py-3 text-center border-r border-gray-100">
                        <span className="inline-flex items-center rounded-full bg-teal-100 text-teal-700 px-2.5 py-1 text-xs font-semibold">
                          After
                        </span>
                      </td>
                      {ALL_METRICS.map((m) => {
                        const { after, delta } = item.metrics[m] ?? {}
                        const { color, icon } = getDeltaStyle(m, delta ?? null)
                        return (
                          <td key={`after-${m}`} className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <MetricValue metric={m} value={after} />
                              <span className={`text-xs font-bold ${color} flex items-center gap-0.5`}>
                                {icon === 'up' && <IoMdArrowDropup className="text-base" />}
                                {icon === 'down' && <IoMdArrowDropdown className="text-base" />}
                                {fmtDelta(delta ?? null)}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const [beforeFile,   setBeforeFile]   = useState(null)
  const [afterFile,    setAfterFile]    = useState(null)
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState('')
  const [deviceFilter, setDeviceFilter] = useState('all')

  useEffect(() => {
    let active = true

    const loadLatest = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/compareAudits/latest`)
        if (!response.ok) return

        const data = await response.json()
        if (active) setResult(data)
      } catch {}
    }

    loadLatest()

    return () => {
      active = false
    }
  }, [])

  const handleCompare = async () => {
    if (!beforeFile || !afterFile) { setError('Please select both CSV files.'); return }
    setError('')
    try {
      const formData = new FormData()
      formData.append('before', beforeFile)
      formData.append('after', afterFile)

      const response = await fetch(`${API_BASE_URL}/api/v1/users/compareAudits`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to compare CSV files.')
      }

      setResult(data)
    } catch (e) {
      setError(e.message || 'Failed to compare CSV files.')
    }
  }

  const handleClear = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/users/compareAudits/latest`, {
        method: 'DELETE',
      })
    } catch {}

    setResult(null); setBeforeFile(null); setAfterFile(null); setError(''); setDeviceFilter('all')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compare Audits</h1>
          <p className="text-sm text-gray-500 mt-1">Upload before &amp; after CSV exports to analyze metric changes</p>
        </div>
        {result && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 transition whitespace-nowrap"
          >
            <RiDeleteBin6Line /> Clear
          </button>
        )}
      </div>

      {/* ── Upload ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DropZone label="Before CSV" file={beforeFile} onFile={setBeforeFile} />
          <DropZone label="After CSV"  file={afterFile}  onFile={setAfterFile}  />
        </div>
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        <button
          onClick={handleCompare}
          disabled={!beforeFile || !afterFile}
          className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition disabled:bg-gray-300"
        >
          Compare
        </button>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-6">
          {result.savedAt && (
            <p className="text-xs text-gray-400">Compared: {new Date(result.savedAt).toLocaleString('en-IN')}</p>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Before', value: result.summary.before, color: 'text-gray-700' },
              { label: 'After', value: result.summary.after, color: 'text-gray-700' },
              { label: 'Compared', value: result.summary.compared, color: 'text-teal-600' },
              { label: 'New', value: result.summary.added, color: 'text-blue-600' },
              { label: 'Removed', value: result.summary.removed, color: 'text-red-500' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
                <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                <div className="text-xs text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Device Filter Toggle */}
          {result.compared.length > 0 && (
            <div className="flex justify-between items-center flex-wrap gap-4">
              <DeviceToggle value={deviceFilter} onChange={setDeviceFilter} />
              <p className="text-xs text-gray-500">
                Showing {deviceFilter === 'all'
                  ? `${result.compared.length} URLs`
                  : `${result.compared.filter((d) => d.deviceType === deviceFilter).length} ${deviceFilter} URLs`}
              </p>
            </div>
          )}

          {/* Compared URLs Table */}
          {result.compared.length > 0 && <CompareTable data={result.compared} deviceFilter={deviceFilter} />}

          {/* New URLs */}
          {result.added?.length > 0 && (
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
              <p className="text-sm font-semibold text-blue-700 mb-3">🎉 New URLs (after only)</p>
              <div className="space-y-2">
                {result.added.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm bg-white p-3 rounded-lg border border-blue-100">
                    <DeviceBadge deviceType={item.deviceType} />
                    <Link href={item.url} target="_blank" className="text-blue-600 hover:underline truncate flex-1 font-medium">
                      {item.url}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed URLs */}
          {result.removed?.length > 0 && (
            <div className="border border-red-200 rounded-xl p-4 bg-red-50">
              <p className="text-sm font-semibold text-red-700 mb-3">⚠️ Removed URLs (before only)</p>
              <div className="space-y-2">
                {result.removed.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm bg-white p-3 rounded-lg border border-red-100">
                    <DeviceBadge deviceType={item.deviceType} />
                    <Link href={item.url} target="_blank" className="text-red-600 hover:underline truncate flex-1 font-medium">
                      {item.url}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
