/**
 * @file WorkspaceAiControl.jsx
 * Không gian làm việc Kiểm soát AI & API Inspector:
 * - Cấu hình Endpoint, API Key, Model, Temperature
 * - Nút kiểm tra API (Ping Test) xem có hoạt động không
 * - Ghi lại nhật ký mọi lần gọi API: lúc nào, input & output đầy đủ hoàn toàn, latency, tên model
 * - Trình thử nghiệm prompt tự do (Playground)
 */

import React, { useState, useEffect, useMemo } from 'react';
import styles from './WorkspaceAiControl.module.css';
import {
  getAiConfig,
  saveAiConfig,
  resetAiConfig,
  getAiLogs,
  clearAiLogs,
  exportAiLogsJson,
  testAiConnection,
  executePlaygroundCall,
} from '../../services/aiLogger.js';
import { copyToClipboard as safeCopy } from '../../lib/clipboard.js';
import {
  CpuIcon,
  PlayIcon,
  CheckIcon,
  CopyIcon,
  TrashIcon,
  DownloadIcon,
  RefreshCwIcon,
  SearchIcon,
  EyeIcon,
  AlertCircleIcon,
  SparklesIcon,
  ClockIcon,
  ZapIcon,
  TerminalIcon,
} from '../ui/Icons.jsx';

const MODEL_PRESETS = [
  { label: 'chib/gemini-3.8-flash (Vilao)', val: 'chib/gemini-3.8-flash' },
  { label: 'gemini-1.5-flash', val: 'gemini-1.5-flash' },
  { label: 'gemini-1.5-pro', val: 'gemini-1.5-pro' },
  { label: 'gpt-4o-mini', val: 'gpt-4o-mini' },
  { label: 'gpt-4o', val: 'gpt-4o' },
];

const BASE_URL_PRESETS = [
  { label: 'Vilao.ai (OpenAI Compat)', val: 'https://api.vilao.ai/v1' },
  { label: 'Google Gemini (Native API)', val: 'https://generativelanguage.googleapis.com/v1beta' },
];

const SAMPLE_PROMPTS = [
  {
    title: '⚡ Ping Test (PONG)',
    text: 'Chào bạn! Vui lòng phản hồi ngắn gọn đúng 1 chữ: PONG',
  },
  {
    title: '✨ Thử nghiệm sinh tiêu đề',
    text: 'Hãy tạo 1 tiêu đề lôi cuốn (dưới 12 từ) và 1 đoạn mô tả (2 câu) cho sự kiện: "Hội thảo AI & Vibe Coding Vietnam 2026: Kiến tạo tương lai".',
  },
  {
    title: '📋 Thử nghiệm JSON Schema',
    text: 'Trả về đúng 1 khối JSON hợp lệ theo mẫu: {"status":"ready","service":"Event Landing Studio","features":["Fast Landing","AI Guard","Realtime Sync"]}',
  },
];

export function WorkspaceAiControl({ project: _project, onShowToast }) {
  // Cấu hình AI
  const [config, setConfig] = useState(() => getAiConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [configDirty, setConfigDirty] = useState(false);

  // Trạng thái Test API & Playground
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [customPrompt, setCustomPrompt] = useState(SAMPLE_PROMPTS[0].text);
  const [isPlaying, setIsPlaying] = useState(false);

  // Nhật ký cuộc gọi
  const [logs, setLogs] = useState(() => getAiLogs());
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'success' | 'error' | 'mock'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState(() => getAiLogs()[0]?.id || null);
  const [inspectorTab, setInspectorTab] = useState('output'); // 'input' | 'output' | 'meta'
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const handleLogAdded = (e) => {
      const nextLogs = getAiLogs();
      setLogs(nextLogs);
      if (e.detail?.id) {
        setSelectedLogId(e.detail.id);
      }
    };
    const handleLogsCleared = () => {
      setLogs([]);
      setSelectedLogId(null);
    };
    const handleConfigUpdated = (e) => {
      if (e.detail) setConfig(e.detail);
    };

    window.addEventListener('els:ai_log_added', handleLogAdded);
    window.addEventListener('els:ai_logs_cleared', handleLogsCleared);
    window.addEventListener('els:ai_config_updated', handleConfigUpdated);

    return () => {
      window.removeEventListener('els:ai_log_added', handleLogAdded);
      window.removeEventListener('els:ai_logs_cleared', handleLogsCleared);
      window.removeEventListener('els:ai_config_updated', handleConfigUpdated);
    };
  }, []);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = logs.length;
    const successes = logs.filter((l) => l.status === 'success').length;
    const errors = logs.filter((l) => l.status === 'error').length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 100;
    const validLatencies = logs.filter((l) => typeof l.latencyMs === 'number' && l.latencyMs > 0);
    const avgLatency = validLatencies.length > 0
      ? Math.round(validLatencies.reduce((sum, l) => sum + l.latencyMs, 0) / validLatencies.length)
      : 0;

    return { total, successes, errors, successRate, avgLatency };
  }, [logs]);

  // Bộ lọc nhật ký
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (activeFilter === 'success' && l.status !== 'success') return false;
      if (activeFilter === 'error' && l.status !== 'error') return false;
      if (activeFilter === 'mock' && l.status !== 'mock') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const modelMatch = (l.model || '').toLowerCase().includes(q);
        const purposeMatch = (l.purpose || '').toLowerCase().includes(q);
        const promptMatch = (l.input?.prompt || '').toLowerCase().includes(q);
        const outputMatch = (l.output?.rawText || '').toLowerCase().includes(q);
        return modelMatch || purposeMatch || promptMatch || outputMatch;
      }
      return true;
    });
  }, [logs, activeFilter, searchQuery]);

  const activeLog = useMemo(() => {
    return logs.find((l) => l.id === selectedLogId) || filteredLogs[0] || null;
  }, [logs, selectedLogId, filteredLogs]);

  // Xử lý lưu cấu hình
  const handleSaveConfig = () => {
    saveAiConfig(config);
    setConfigDirty(false);
    onShowToast?.('Đã lưu cấu hình AI thành công!', 'success');
  };

  const handleResetConfig = () => {
    resetAiConfig();
    setConfig(getAiConfig());
    setConfigDirty(false);
    onShowToast?.('Đã khôi phục cấu hình AI về mặc định .env!', 'info');
  };

  // Xử lý kiểm tra API (Ping Test)
  const handleTestApi = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAiConnection(config);
      setTestResult(res);
      if (res.ok) {
        onShowToast?.(`Kết nối AI thành công! Độ trễ: ${res.latencyMs}ms (${res.model})`, 'success');
      } else {
        onShowToast?.(`Kiểm tra API thất bại: ${res.error}`, 'error');
      }
    } catch (e) {
      setTestResult({ ok: false, error: e.message, latencyMs: 0 });
      onShowToast?.(`Lỗi kiểm tra: ${e.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // Xử lý chạy prompt Playground
  const handleRunPlayground = async () => {
    if (!customPrompt.trim()) return;
    setIsPlaying(true);
    try {
      const res = await executePlaygroundCall(customPrompt, config, 'Thử nghiệm prompt tự do (Playground)');
      if (res.ok) {
        onShowToast?.(`Gọi API thành công trong ${res.latencyMs}ms`, 'success');
      } else {
        onShowToast?.(`Lỗi gọi API: ${res.error}`, 'error');
      }
    } catch (e) {
      onShowToast?.(`Lỗi thực thi: ${e.message}`, 'error');
    } finally {
      setIsPlaying(false);
    }
  };

  const copyToClipboard = async (text, keyName) => {
    if (!text) return;
    const content = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
    const ok = await safeCopy(content);
    if (ok) {
      setCopiedKey(keyName);
      onShowToast?.('Đã sao chép vào bộ nhớ tạm!', 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Toolbar */}
      <div className={styles.headerBar}>
        <div className={styles.titleArea}>
          <div className={styles.titleIconWrap}>
            <CpuIcon size={24} />
          </div>
          <div>
            <h1 className={styles.mainTitle}>
              Kiểm soát AI & Nhật ký gọi API
              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 9999, background: config.forceMock ? '#fef3c7' : '#dcfce7', color: config.forceMock ? '#b45309' : '#15803d', fontWeight: 700 }}>
                {config.forceMock ? 'Chế độ Giả lập (Mock)' : 'Kết nối API Trực tiếp'}
              </span>
            </h1>
            <p className={styles.subTitle}>
              Giám sát thời gian thực, đo lường độ trễ (latency), thanh tra chi tiết 100% input/output và kiểm thử kết nối API.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleTestApi}
            disabled={isTesting}
            title="Thực hiện cuộc gọi kiểm thử ngay tới API"
          >
            {isTesting ? <span className={styles.spinner} /> : <ZapIcon size={16} />}
            <span>{isTesting ? 'Đang kiểm tra kết nối...' : '⚡ Kiểm tra kết nối API'}</span>
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={exportAiLogsJson}
            disabled={logs.length === 0}
            title="Xuất toàn bộ nhật ký ra tệp tin JSON"
          >
            <DownloadIcon size={15} />
            <span>Xuất JSON ({logs.length})</span>
          </button>

          {logs.length > 0 && (
            <button
              type="button"
              className={styles.btnDangerOutline}
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn xóa sạch toàn bộ lịch sử gọi API không?')) {
                  clearAiLogs();
                  onShowToast?.('Đã xóa toàn bộ nhật ký gọi API.', 'info');
                }
              }}
              title="Xóa toàn bộ nhật ký"
            >
              <TrashIcon size={14} />
              <span>Xóa nhật ký</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Thẻ thống kê tổng quan (Stats Row) */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#fff1f3', color: '#e11d48' }}>
            <TerminalIcon size={20} />
          </div>
          <div>
            <div className={styles.statVal}>{stats.total}</div>
            <div className={styles.statLabel}>Tổng lượt gọi API</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckIcon size={20} />
          </div>
          <div>
            <div className={styles.statVal}>{stats.successRate}%</div>
            <div className={styles.statLabel}>Tỷ lệ thành công ({stats.successes}/{stats.total})</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <ClockIcon size={20} />
          </div>
          <div>
            <div className={styles.statVal}>{stats.avgLatency} <small style={{ fontSize: '0.75rem', fontWeight: 600 }}>ms</small></div>
            <div className={styles.statLabel}>Độ trễ TB (Latency)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: '#fef3c7', color: '#d97706' }}>
            <CpuIcon size={20} />
          </div>
          <div>
            <div className={styles.statVal} style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}>{config.model}</div>
            <div className={styles.statLabel}>Model đang kích hoạt</div>
          </div>
        </div>
      </div>

      {/* Kết quả Test nhanh nếu vừa nhấn nút Test */}
      {testResult && (
        <div className={`${styles.testBanner} ${testResult.ok ? styles.testBannerSuccess : styles.testBannerError}`}>
          <div className={styles.testBannerHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {testResult.ok ? <CheckIcon size={18} /> : <AlertCircleIcon size={18} />}
              {testResult.ok ? 'KẾT NỐI API THÀNH CÔNG (200 OK)' : 'KẾT NỐI API THẤT BẠI'}
            </span>
            <span className={`${styles.latencyTag} ${testResult.latencyMs < 2000 ? styles.latencyFast : testResult.latencyMs < 5000 ? styles.latencyMed : styles.latencySlow}`}>
              <ClockIcon size={12} /> {testResult.latencyMs} ms
            </span>
          </div>
          <div className={styles.testBannerBody}>
            <strong>Model:</strong> {testResult.model} | <strong>Mã phản hồi:</strong> {testResult.statusCode || 200}<br />
            <strong>Nội dung:</strong> {testResult.ok ? testResult.text : testResult.error}
          </div>
        </div>
      )}

      {/* 3. Bố cục chính 2 cột: Cấu hình / Playground (Trái) & Nhật ký cuộc gọi Inspector (Phải) */}
      <div className={styles.mainGrid}>
        {/* CỘT TRÁI: Cấu hình & Trình gọi thử nghiệm */}
        <div className={styles.leftCol}>
          {/* Card 1: Cấu hình Model & Kết nối */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <CpuIcon size={18} /> Cấu hình Kết nối AI Model
              </h2>
              {configDirty && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>
                  Có thay đổi chưa lưu
                </span>
              )}
            </div>

            {/* Bật/Tắt Mock */}
            <div className={styles.toggleBox}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Chế độ Mock (Giả lập)</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Bật để không tiêu tốn token và kiểm thử cục bộ</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={config.forceMock}
                  onChange={(e) => {
                    setConfig({ ...config, forceMock: e.target.checked });
                    setConfigDirty(true);
                  }}
                />
                <span className={styles.slider} />
              </label>
            </div>

            {/* Tên Model */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>Tên Model (Model ID)</span>
                <small style={{ color: '#64748b' }}>Hiện tại: {config.model}</small>
              </label>
              <input
                type="text"
                className={styles.formInput}
                value={config.model}
                onChange={(e) => {
                  setConfig({ ...config, model: e.target.value });
                  setConfigDirty(true);
                }}
                placeholder="VD: chib/gemini-3.8-flash, gemini-1.5-flash..."
              />
              <div className={styles.chipList}>
                {MODEL_PRESETS.map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    className={`${styles.presetChip} ${config.model === p.val ? styles.activeChip : ''}`}
                    onClick={() => {
                      setConfig({ ...config, model: p.val });
                      setConfigDirty(true);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Base URL */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>Base URL Endpoint</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                value={config.baseUrl}
                onChange={(e) => {
                  setConfig({ ...config, baseUrl: e.target.value });
                  setConfigDirty(true);
                }}
                placeholder="https://api.vilao.ai/v1 hoặc https://generativelanguage.googleapis.com/v1beta"
              />
              <div className={styles.chipList}>
                {BASE_URL_PRESETS.map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    className={`${styles.presetChip} ${config.baseUrl === p.val ? styles.activeChip : ''}`}
                    onClick={() => {
                      setConfig({ ...config, baseUrl: p.val });
                      setConfigDirty(true);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>API Key</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Lưu trữ an toàn trong localStorage</span>
              </label>
              <div className={styles.inputGroupRow}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className={styles.formInput}
                  value={config.apiKey}
                  onChange={(e) => {
                    setConfig({ ...config, apiKey: e.target.value });
                    setConfigDirty(true);
                  }}
                  placeholder="sk-... hoặc AIza..."
                />
                <button
                  type="button"
                  className={styles.btnInputEye}
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Ẩn khóa API' : 'Hiện khóa API'}
                >
                  <EyeIcon size={16} />
                </button>
              </div>
            </div>

            {/* Sliders: Temperature & Timeout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Temperature</span>
                  <span className={styles.rangeVal}>{config.temperature}</span>
                </label>
                <div className={styles.rangeWrap}>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    className={styles.rangeInput}
                    value={config.temperature}
                    onChange={(e) => {
                      setConfig({ ...config, temperature: parseFloat(e.target.value) });
                      setConfigDirty(true);
                    }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Timeout (giây)</span>
                  <span className={styles.rangeVal}>{config.timeoutSec || 20}s</span>
                </label>
                <div className={styles.rangeWrap}>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    className={styles.rangeInput}
                    value={config.timeoutSec || 20}
                    onChange={(e) => {
                      setConfig({ ...config, timeoutSec: parseInt(e.target.value, 10) });
                      setConfigDirty(true);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Buttons lưu & reset */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleSaveConfig}
                style={{ flex: 1 }}
              >
                <CheckIcon size={16} /> Lưu cấu hình
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleResetConfig}
                title="Khôi phục lại biến môi trường .env"
              >
                <RefreshCwIcon size={15} /> Khôi phục .env
              </button>
            </div>
          </div>

          {/* Card 2: Trình thử nghiệm gọi API (Playground) */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <PlayIcon size={16} /> Trình gọi API Thử nghiệm (Playground)
              </h2>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>Mẫu câu hỏi kiểm tra nhanh:</span>
              </label>
              <div className={styles.chipList}>
                {SAMPLE_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.presetChip}
                    onClick={() => setCustomPrompt(sp.text)}
                  >
                    {sp.title}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span>Input Prompt gửi tới Model:</span>
              </label>
              <textarea
                className={styles.formTextarea}
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Nhập prompt bất kỳ để thử nghiệm..."
              />
            </div>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleRunPlayground}
              disabled={isPlaying || !customPrompt.trim()}
              style={{ width: '100%' }}
            >
              {isPlaying ? <span className={styles.spinner} /> : <PlayIcon size={16} />}
              <span>{isPlaying ? 'Đang gửi yêu cầu tới Model...' : 'Gửi yêu cầu gọi API'}</span>
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: Lịch sử cuộc gọi & Thanh tra Inspector */}
        <div className={styles.rightCol}>
          {/* Header thanh lọc & tìm kiếm */}
          <div className={styles.card}>
            <div className={styles.logsHeader}>
              <div className={styles.filterRow}>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginRight: 4 }}>
                  Nhật ký:
                </span>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.activeFilter : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  Tất cả ({logs.length})
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${activeFilter === 'success' ? styles.activeFilter : ''}`}
                  onClick={() => setActiveFilter('success')}
                >
                  Thành công ({stats.successes})
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${activeFilter === 'error' ? styles.activeFilter : ''}`}
                  onClick={() => setActiveFilter('error')}
                >
                  Lỗi ({stats.errors})
                </button>
              </div>

              <div style={{ position: 'relative', width: 200 }}>
                <SearchIcon size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm log..."
                  className={styles.formInput}
                  style={{ padding: '6px 10px 6px 30px', fontSize: '0.8rem' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Danh sách cuộn các lần gọi */}
            <div className={styles.logListScroll}>
              {filteredLogs.length === 0 ? (
                <div className={styles.emptyLogs}>
                  <TerminalIcon size={32} />
                  <span>Chưa có lượt gọi API nào được ghi nhận.</span>
                  <small>Hãy nhấn &quot;⚡ Kiểm tra kết nối API&quot; ở góc trên để tạo bản ghi đầu tiên.</small>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.status === 'success';
                  const isMock = log.status === 'mock';
                  const isSelected = activeLog?.id === log.id;

                  return (
                    <div
                      key={log.id}
                      className={`${styles.logItem} ${isSelected ? styles.logItemActive : ''}`}
                      onClick={() => setSelectedLogId(log.id)}
                    >
                      <div className={styles.logTopRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span
                            className={`${styles.logStatusBadge} ${isSuccess ? styles.statusSuccess : isMock ? styles.statusMock : styles.statusError
                              }`}
                          >
                            {isSuccess ? '● 200 OK' : isMock ? '● MOCK' : `● ${log.statusCode || 'ERR'}`}
                          </span>
                          <span className={styles.logModelName} title={log.model}>{log.model}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span className={`${styles.latencyTag} ${log.latencyMs < 2000 ? styles.latencyFast : log.latencyMs < 5000 ? styles.latencyMed : styles.latencySlow}`}>
                            <ClockIcon size={11} /> {log.latencyMs} ms
                          </span>
                          <span className={styles.logTime}>{log.formattedTime}</span>
                        </div>
                      </div>

                      <p className={styles.logPurpose}>
                        <SparklesIcon size={13} style={{ color: '#e11d48', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.purpose}</span>
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CHI TIẾT THANH TRA TOÀN DIỆN (FULL API INSPECTOR) */}
          {activeLog && (
            <div className={styles.inspectorCard}>
              <div className={styles.inspectorHeader}>
                <h3 className={styles.inspectorTitle}>
                  <TerminalIcon size={20} />
                  Thanh tra chi tiết cuộc gọi #{activeLog.id}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`${styles.latencyTag} ${activeLog.latencyMs < 2000 ? styles.latencyFast : activeLog.latencyMs < 5000 ? styles.latencyMed : styles.latencySlow}`}>
                    Độ trễ: {activeLog.latencyMs} ms
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {activeLog.formattedTime} - {activeLog.formattedDate}
                  </span>
                </div>
              </div>

              {/* Thông số nhanh */}
              <div className={styles.metaGrid}>
                <div className={styles.metaCol}>
                  <span className={styles.metaKey}>Tên Model</span>
                  <span className={styles.metaVal}>{activeLog.model}</span>
                </div>
                <div className={styles.metaCol}>
                  <span className={styles.metaKey}>Mã trạng thái</span>
                  <span className={styles.metaVal} style={{ color: activeLog.status === 'success' ? '#4ade80' : '#f87171' }}>
                    {activeLog.statusCode} ({activeLog.status})
                  </span>
                </div>
                <div className={styles.metaCol}>
                  <span className={styles.metaKey}>Endpoint URL</span>
                  <span className={styles.metaVal} style={{ fontSize: '0.75rem' }}>{activeLog.endpoint}</span>
                </div>
                <div className={styles.metaCol}>
                  <span className={styles.metaKey}>Mục đích gọi</span>
                  <span className={styles.metaVal} style={{ fontSize: '0.8rem' }}>{activeLog.purpose}</span>
                </div>
              </div>

              {/* Tabs chuyển đổi: Output / Input / Meta */}
              <div className={styles.inspectorTabs}>
                <button
                  type="button"
                  className={`${styles.inspTabBtn} ${inspectorTab === 'output' ? styles.inspTabActive : ''}`}
                  onClick={() => setInspectorTab('output')}
                >
                  OUTPUT ĐẦY ĐỦ ({activeLog.output?.rawText?.length || 0} ký tự)
                </button>
                <button
                  type="button"
                  className={`${styles.inspTabBtn} ${inspectorTab === 'input' ? styles.inspTabActive : ''}`}
                  onClick={() => setInspectorTab('input')}
                >
                  INPUT ĐẦY ĐỦ ({activeLog.input?.prompt?.length || 0} ký tự)
                </button>
                <button
                  type="button"
                  className={`${styles.inspTabBtn} ${inspectorTab === 'meta' ? styles.inspTabActive : ''}`}
                  onClick={() => setInspectorTab('meta')}
                >
                  RAW JSON / DIAGNOSTICS
                </button>
              </div>

              {/* Nội dung Tab */}
              {inspectorTab === 'output' && (
                <div className={styles.codeBoxWrap}>
                  <button
                    type="button"
                    className={styles.btnCopyOverlay}
                    onClick={() => copyToClipboard(activeLog.output?.rawText || activeLog.output?.error, 'output')}
                  >
                    {copiedKey === 'output' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    <span>{copiedKey === 'output' ? 'Đã chép' : 'Sao chép Output'}</span>
                  </button>
                  <pre className={styles.codeBox}>
                    {activeLog.output?.rawText || (activeLog.output?.error ? `[LỖI]: ${activeLog.output.error}` : 'Không có phản hồi text')}
                  </pre>
                </div>
              )}

              {inspectorTab === 'input' && (
                <div className={styles.codeBoxWrap}>
                  <button
                    type="button"
                    className={styles.btnCopyOverlay}
                    onClick={() => copyToClipboard(activeLog.input?.prompt, 'input')}
                  >
                    {copiedKey === 'input' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    <span>{copiedKey === 'input' ? 'Đã chép' : 'Sao chép Input Prompt'}</span>
                  </button>
                  <pre className={styles.codeBox}>
                    {activeLog.input?.prompt || 'Không có prompt ghi nhận'}
                  </pre>
                </div>
              )}

              {inspectorTab === 'meta' && (
                <div className={styles.codeBoxWrap}>
                  <button
                    type="button"
                    className={styles.btnCopyOverlay}
                    onClick={() => copyToClipboard(JSON.stringify(activeLog, null, 2), 'rawJson')}
                  >
                    {copiedKey === 'rawJson' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    <span>{copiedKey === 'rawJson' ? 'Đã chép' : 'Sao chép toàn bộ Log JSON'}</span>
                  </button>
                  <pre className={styles.codeBox}>
                    {JSON.stringify(activeLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
