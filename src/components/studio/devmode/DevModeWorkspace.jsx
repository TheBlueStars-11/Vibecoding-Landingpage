import React, { useState, useMemo, useRef, useCallback } from 'react';
import styles from './DevModeWorkspace.module.css';
import {
  BREAKPOINT_PRESETS,
  MODULE_CATALOG,
  createModuleInstance,
  createDefaultModuleTree,
  PRESET_TEMPLATES,
  createPresetModuleTree,
  STANDALONE_DEV_MOCK_DATA,
  TEST_DATASETS,
  COLOR_THEMES,
  DEFAULT_COLOR_THEME,
  getDeletedModuleTypes,
  getDeletedVariants,
  saveDeletedModuleType,
  saveDeletedVariant,
  restoreDefaultCatalog,
} from '../../../domain/moduleSchema.js';
import { generateId } from '../../../domain/elsSchema.js';
import {
  auditModuleLayout,
  runResponsiveScan,
  exportAuditReport,
  AUDIT_LEVELS,
} from '../../../domain/moduleAuditor.js';
import { ModuleRenderer } from './ModuleRenderer.jsx';
import {
  PlusIcon,
  CopyIcon,
  MoveUpIcon,
  MoveDownIcon,
  RefreshCwIcon,
  SearchIcon,
  CloseIcon,
  AlertCircleIcon,
  DownloadIcon,
  UploadIcon,
  LaptopIcon,
  PhoneIcon,
  EyeIcon,
  SparklesIcon,
  CheckIcon,
  TrashIcon,
  FileTextIcon,
  LockIcon,
  UnlockIcon,
  PaletteIcon,
} from '../../ui/Icons.jsx';
import { ConfirmDialog } from '../../ui/ConfirmDialog.jsx';


function generateReviewMarkdown(reviewsList = []) {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const acceptedCount = reviewsList.filter((r) => r.status === 'accepted').length;
  const rejectedCount = reviewsList.filter((r) => r.status === 'rejected').length;
  const pendingCount = reviewsList.filter((r) => r.status === 'pending').length;

  return `# NHẬT KÝ ĐÁNH GIÁ VÀ PHÊ DUYỆT MODULE (DEV MODE)
> **Dự án:** Event Landing Studio (ELS) — Vibecoding 2026, Đề số 08
> **Ngày ghi chép:** ${now}
> **Mục đích:** Ghi nhận đánh giá chấp nhận, loại bỏ và các ý kiến đóng góp của người dùng đối với từng module để AI Agent và đội ngũ phát triển tiếp tục cải tiến.

---

## 1. TỔNG QUAN KẾT QUẢ ĐÁNH GIÁ

| Chỉ số | Số lượng | Tỷ lệ (%) |
|---|:---:|:---:|
| **Tổng số module đã đánh giá** | **${reviewsList.length}** | 100% |
| **Đã chấp nhận (Approved)** | **${acceptedCount}** | ${reviewsList.length ? Math.round((acceptedCount / reviewsList.length) * 100) : 0}% |
| **Đã loại bỏ (Rejected)** | **${rejectedCount}** | ${reviewsList.length ? Math.round((rejectedCount / reviewsList.length) * 100) : 0}% |
| **Cần xem xét thêm (Pending)** | **${pendingCount}** | ${reviewsList.length ? Math.round((pendingCount / reviewsList.length) * 100) : 0}% |

---

## 2. CHI TIẾT ĐÁNH GIÁ TỪNG MODULE

${reviewsList.length === 0 ? '_Chưa có ghi chép đánh giá nào._' : reviewsList.map((item, idx) => `
### ${idx + 1}. [${item.status === 'accepted' ? 'CHẤP NHẬN ✓' : item.status === 'rejected' ? 'LOẠI BỎ ✗' : 'ĐANG XEM XÉT ⏳'}] ${item.moduleName || item.moduleType} (\`${item.moduleType}\`)
- **Biến thể (Variant):** \`${item.variant || 'default'}\`
- **Trạng thái:** **${item.status === 'accepted' ? 'Đã phê duyệt chấp nhận' : item.status === 'rejected' ? 'Đã yêu cầu loại bỏ' : 'Đang xem xét'}**
- **Thời gian đánh giá:** ${item.updatedAt || now}
- **Nhận xét & Góp ý cải tiến:**
> ${item.comment ? item.comment.replace(/\n/g, '\n> ') : '_Không có nhận xét thêm._'}
`).join('\n---\n')}

---

## 3. ĐỀ XUẤT HÀNH ĐỘNG DÀNH CHO AI AGENT
Dựa trên các module bị loại bỏ hoặc có nhận xét:
1. Đối với các module bị loại bỏ: Phân tích lý do và cải tiến bố cục, cỡ chữ, khoảng cách đệm hoặc ẩn khỏi preset mặc định.
2. Đối với các module được chấp nhận: Giữ nguyên cấu trúc slot và nhân rộng phong cách thiết kế sang các biến thể khác.
`;
}

function downloadMarkdown(content, filename = 'MODULE_DEV_REVIEW_LOG.md') {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DevModeWorkspace({
  project,
  onUpdateProject: _onUpdateProject,
  onShowToast,
  onExitDevMode,
}) {
  // 1. Quản lý danh sách Modules (Bắt đầu rỗng để mở độc lập từng module theo yêu cầu)
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  // 2. Kích thước khung Canvas (Resizable Canvas)
  const [canvasWidth, setCanvasWidth] = useState(375);
  const [canvasHeight, setCanvasHeight] = useState(667);
  const [selectedPreset, setSelectedPreset] = useState('mobile-m');
  const [zoomLevel, setZoomLevel] = useState(1); // 0.5, 0.75, 1, 1.25
  const [isHeightAuto, setIsHeightAuto] = useState(false);
  const [devThemeColor, setDevThemeColor] = useState(() => project?.colorTheme || DEFAULT_COLOR_THEME || 'purple');
  const [devAlternatingBg, setDevAlternatingBg] = useState(() => project?.alternatingBg !== false);
  const [showBezel, setShowBezel] = useState(true);
  const viewportRef = useRef(null);

  // 3. Dữ liệu thử nghiệm (Test Dataset)
  const [selectedDatasetKey, setSelectedDatasetKey] = useState('real');

  // 4. Bảng kiểm tra & Chẩn đoán (Audit Panel)
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditTab, setAuditTab] = useState('issues'); // 'issues' | 'scan' | 'json'
  const [scanResult, setScanResult] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // 5. Thêm module Modal & Lọc Catalog
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // 6. Hoàn tác / Làm lại (Undo / Redo)
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 7. Xác nhận nguy hiểm
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });

  // 8. Kéo đổi kích thước khung (Drag Resizing)
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: 375, h: 667, edge: null });

  // 9. Hệ thống Đánh giá & Ghi chép Module (Accept / Reject / Comments)
  const [reviews, setReviews] = useState(() => {
    try {
      const raw = localStorage.getItem('ELS_MODULE_REVIEWS');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'accepted' | 'rejected' | 'commented'

  // 10. Quản lý xóa vĩnh viễn biến thể & nhóm module (Lưu vào localStorage)
  const [deletedModuleTypes, setDeletedModuleTypes] = useState(() => getDeletedModuleTypes());
  const [deletedVariants, setDeletedVariants] = useState(() => getDeletedVariants());


  // ==============================================================
  // DỮ LIỆU ĐỘC LẬP CHO DEV MODE (HOÀN TOÀN TÁCH BIỆT DỰ ÁN)
  // Có đầy đủ ảnh mẫu, tiêu đề mẫu, nội dung mẫu cho 12 module
  // ==============================================================
  const activeEventData = useMemo(() => {
    if (selectedDatasetKey !== 'real' && TEST_DATASETS[selectedDatasetKey]) {
      return TEST_DATASETS[selectedDatasetKey].event || {};
    }
    return STANDALONE_DEV_MOCK_DATA.event;
  }, [selectedDatasetKey]);

  const activeAiData = useMemo(() => {
    if (selectedDatasetKey !== 'real' && TEST_DATASETS[selectedDatasetKey]) {
      return TEST_DATASETS[selectedDatasetKey].ai || {};
    }
    return STANDALONE_DEV_MOCK_DATA.ai;
  }, [selectedDatasetKey]);

  const activeAssets = useMemo(() => {
    return STANDALONE_DEV_MOCK_DATA.assets;
  }, []);

  const activeFormFields = useMemo(() => {
    return STANDALONE_DEV_MOCK_DATA.formFields;
  }, []);

  // Lưu lịch sử khi modules thay đổi
  const pushHistory = useCallback((newModules) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newModules];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Cập nhật modules trong phòng thử nghiệm độc lập
  const updateModules = useCallback((newModules, addToHistory = true) => {
    setModules(newModules);
    if (addToHistory) {
      pushHistory(newModules);
    }
  }, [pushHistory]);

  // ==============================================================
  // THAO TÁC MỞ ĐỘC LẬP / GHÉP / LÀM RỖNG MODULE
  // ==============================================================
  const handleOpenSingleModule = (type) => {
    const newMod = createModuleInstance(type);
    updateModules([newMod]);
    setSelectedModuleId(newMod.id);
    onShowToast?.(`Đang thử nghiệm độc lập: "${newMod.name}" với dữ liệu mẫu hoàn chỉnh.`, 'info');
  };

  const handleAppendModule = (type) => {
    const newMod = createModuleInstance(type);
    updateModules([...modules, newMod]);
    setSelectedModuleId(newMod.id);
    onShowToast?.(`Đã ghép module "${newMod.name}" vào khung kiểm thử.`, 'info');
  };

  const handleClearModules = () => {
    updateModules([]);
    setSelectedModuleId(null);
    onShowToast?.('Đã làm rỗng khung kiểm thử.', 'info');
  };

  // Xác định breakpoint hiện tại theo width
  const currentBreakpointCategory = useMemo(() => {
    if (canvasWidth < 768) return 'mobile';
    if (canvasWidth < 1024) return 'tablet';
    return 'desktop';
  }, [canvasWidth]);

  // Kiểm tra tự động các lỗi trên khung hiện tại
  const currentAuditIssues = useMemo(() => {
    return auditModuleLayout(modules, activeEventData, activeAssets, canvasWidth);
  }, [modules, activeEventData, activeAssets, canvasWidth]);

  // Module đang chọn
  const selectedModule = useMemo(() => {
    return modules.find((m) => m.id === selectedModuleId) || null;
  }, [modules, selectedModuleId]);

  // Thư viện Catalog khả dụng (đã loại trừ các nhóm và biến thể bị xóa vĩnh viễn)
  const activeCatalog = useMemo(() => {
    const deletedTypesSet = new Set(deletedModuleTypes);
    const active = {};
    for (const [type, item] of Object.entries(MODULE_CATALOG)) {
      if (deletedTypesSet.has(type)) continue;
      const delVars = new Set(deletedVariants[type] || []);
      const remainingVariants = item.variants.filter((v) => !delVars.has(v.id));
      active[type] = {
        ...item,
        variants: remainingVariants,
        defaultVariant: remainingVariants.some((v) => v.id === item.defaultVariant)
          ? item.defaultVariant
          : (remainingVariants[0]?.id || item.defaultVariant),
      };
    }
    return active;
  }, [deletedModuleTypes, deletedVariants]);

  // Lọc danh mục module theo từ khóa tìm kiếm
  const filteredCatalog = useMemo(() => {
    const list = Object.values(activeCatalog);
    if (!catalogSearch.trim()) return list;
    const q = catalogSearch.toLowerCase();
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [activeCatalog, catalogSearch]);

  
  // Thống kê nhật ký đánh giá
  const reviewStats = useMemo(() => {
    const list = Object.values(reviews);
    const accepted = list.filter((r) => r.status === 'accepted').length;
    const rejected = list.filter((r) => r.status === 'rejected').length;
    const pending = list.filter((r) => r.status === 'pending').length;
    const commented = list.filter((r) => r.comment && r.comment.trim()).length;
    return { total: list.length, accepted, rejected, pending, commented };
  }, [reviews]);

  // Cập nhật trạng thái đánh giá (Chấp nhận / Loại bỏ)
  const handleSetReviewStatus = useCallback((moduleItem, status) => {
    if (!moduleItem) return;
    const key = moduleItem.id;
    setReviews((prev) => {
      const existing = prev[key] || {};
      const updated = {
        ...prev,
        [key]: {
          ...existing,
          moduleId: moduleItem.id,
          moduleType: moduleItem.type,
          moduleName: moduleItem.name,
          variant: moduleItem.variant,
          status,
          comment: existing.comment || '',
          updatedAt: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        },
      };
      try {
        localStorage.setItem('ELS_MODULE_REVIEWS', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    const label = status === 'accepted' ? 'Chấp nhận ✓' : status === 'rejected' ? 'Loại bỏ ✗' : 'Đang xem xét';
    onShowToast?.(`Đã đánh dấu "${moduleItem.name}": ${label}`, 'info');
  }, [onShowToast]);

  // Cập nhật nhận xét cho module
  const handleUpdateReviewComment = useCallback((moduleItem, comment) => {
    if (!moduleItem) return;
    const key = moduleItem.id;
    setReviews((prev) => {
      const existing = prev[key] || {};
      const updated = {
        ...prev,
        [key]: {
          ...existing,
          moduleId: moduleItem.id,
          moduleType: moduleItem.type,
          moduleName: moduleItem.name,
          variant: moduleItem.variant,
          status: existing.status || 'pending',
          comment,
          updatedAt: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        },
      };
      try {
        localStorage.setItem('ELS_MODULE_REVIEWS', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  // Lưu file ghi chép lên backend và tải về máy
  const handleSaveReviewsToFile = async () => {
    setIsSavingReview(true);
    try {
      const reviewsList = Object.values(reviews);
      const markdownContent = generateReviewMarkdown(reviewsList);

      const res = await fetch('/api/save-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: reviewsList,
          markdownContent,
          summary: reviewStats,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        onShowToast?.(`Đã lưu nhật ký vào file "${data.mdFilePath}" thành công!`, 'success');
      } else {
        downloadMarkdown(markdownContent, 'MODULE_DEV_REVIEW_LOG.md');
        onShowToast?.('Đã tải file ghi chép "MODULE_DEV_REVIEW_LOG.md" về máy!', 'success');
      }
    } catch (err) {
      console.error(err);
      const reviewsList = Object.values(reviews);
      const markdownContent = generateReviewMarkdown(reviewsList);
      downloadMarkdown(markdownContent, 'MODULE_DEV_REVIEW_LOG.md');
      onShowToast?.('Đã tải file ghi chép "MODULE_DEV_REVIEW_LOG.md" về máy!', 'success');
    } finally {
      setIsSavingReview(false);
    }
  };

  // Lọc danh sách đánh giá trong modal
  const filteredReviewList = useMemo(() => {
    const list = Object.values(reviews);
    if (reviewFilter === 'accepted') return list.filter((r) => r.status === 'accepted');
    if (reviewFilter === 'rejected') return list.filter((r) => r.status === 'rejected');
    if (reviewFilter === 'commented') return list.filter((r) => r.comment && r.comment.trim());
    return list;
  }, [reviews, reviewFilter]);

  // Lọc chỉ giữ lại các module đã được chấp nhận, gỡ bỏ tất cả các module còn lại
  const handleKeepAcceptedOnly = () => {
    const acceptedItems = Object.values(reviews).filter((r) => r.status === 'accepted');
    if (acceptedItems.length === 0) {
      onShowToast?.('Chưa có module nào được phê duyệt "Chấp nhận". Hãy tích chọn "✓ Chấp nhận" cho các module trước.', 'warning');
      return;
    }

    const acceptedIds = new Set(acceptedItems.map((r) => r.moduleId));

    // Lọc trên modules hiện tại
    let nextModules = modules.filter((m) => acceptedIds.has(m.id) || reviews[m.id]?.status === 'accepted');

    // Nếu canvas hiện tại đang rỗng hoặc chưa khớp, tái tạo từ các module đã chấp nhận
    if (nextModules.length === 0) {
      nextModules = acceptedItems.map((r) => {
        const inst = createModuleInstance(r.moduleType, { variant: r.variant });
        return {
          ...inst,
          id: r.moduleId || inst.id,
          variant: r.variant || inst.variant,
        };
      });
    }

    updateModules(nextModules);
    setIsReviewModalOpen(false);
    onShowToast?.(`Đã giữ lại ${nextModules.length} module được chấp nhận (${acceptedItems.map((a) => a.moduleName || a.moduleType).join(', ')}). Đã gỡ bỏ toàn bộ module không được chấp nhận.`, 'success');
  };

  const handleApplyAcceptedToLanding = () => {
    const acceptedItems = Object.values(reviews).filter((r) => r.status === 'accepted');
    if (acceptedItems.length === 0) {
      onShowToast?.('Chưa có module nào được phê duyệt chấp nhận.', 'warning');
      return;
    }

    let nextModules = modules.filter((m) => reviews[m.id]?.status === 'accepted');
    if (nextModules.length === 0) {
      nextModules = acceptedItems.map((r) => {
        const inst = createModuleInstance(r.moduleType, { variant: r.variant });
        return {
          ...inst,
          id: r.moduleId || inst.id,
          variant: r.variant || inst.variant,
        };
      });
    }

    updateModules(nextModules);
    if (_onUpdateProject) {
      _onUpdateProject({ moduleLayout: nextModules });
    }
    setIsReviewModalOpen(false);
    onShowToast?.(`Đã áp dụng ${nextModules.length} module được chấp nhận vào Landing Page chính!`, 'success');
  };

  // Xóa vĩnh viễn một biến thể khỏi module
  const handleDeleteVariantPermanently = (moduleType, variantId, variantLabel) => {
    const catItem = activeCatalog[moduleType] || MODULE_CATALOG[moduleType];
    const remaining = (catItem?.variants || []).filter((v) => v.id !== variantId);

    if (remaining.length === 0) {
      onShowToast?.(`Không thể xóa biến thể cuối cùng của nhóm "${catItem?.name || moduleType}". Mỗi nhóm cần ít nhất 1 biến thể.`, 'warning');
      return;
    }

    setConfirmState({
      open: true,
      title: `Xóa vĩnh viễn biến thể "${variantLabel}"?`,
      message: `Biến thể "${variantLabel}" (${variantId}) sẽ bị gỡ bỏ vĩnh viễn khỏi nhóm "${catItem?.name || moduleType}". Thao tác này sẽ lưu vào hệ thống và không còn xuất hiện khi thiết kế.`,
      onConfirm: () => {
        saveDeletedVariant(moduleType, variantId);
        setDeletedVariants((prev) => ({
          ...prev,
          [moduleType]: [...(prev[moduleType] || []), variantId],
        }));

        // Chuyển các module trên canvas đang dùng biến thể này sang biến thể khả dụng khác
        const fallbackVariant = remaining[0]?.id || 'default';
        const updatedCanvas = modules.map((m) => {
          if (m.type === moduleType && m.variant === variantId) {
            return { ...m, variant: fallbackVariant };
          }
          return m;
        });
        updateModules(updatedCanvas);

        setConfirmState({ open: false });
        onShowToast?.(`Đã xóa vĩnh viễn biến thể "${variantLabel}".`, 'success');
      },
    });
  };

  // Xóa vĩnh viễn toàn bộ nhóm module
  const handleDeleteModuleTypePermanently = (moduleType, moduleName) => {
    const catItem = activeCatalog[moduleType] || MODULE_CATALOG[moduleType];
    const displayName = moduleName || catItem?.name || moduleType;
    const variantsCount = (catItem?.variants || []).length;

    setConfirmState({
      open: true,
      title: `XÓA VĨNH VIỄN NHÓM MODULE "${displayName}"?`,
      message: `Toàn bộ ${variantsCount} biến thể và cấu hình của nhóm "${displayName}" (${moduleType}) sẽ bị xóa vĩnh viễn khỏi thư viện module. Tất cả module này trên màn hình Canvas cũng sẽ được gỡ bỏ ngay lập tức.`,
      onConfirm: () => {
        saveDeletedModuleType(moduleType);
        setDeletedModuleTypes((prev) => [...prev, moduleType]);

        // Gỡ toàn bộ module thuộc nhóm này khỏi canvas
        const remainingModules = modules.filter((m) => m.type !== moduleType);
        updateModules(remainingModules);

        if (selectedModule?.type === moduleType) {
          setSelectedModuleId(null);
        }

        setConfirmState({ open: false });
        onShowToast?.(`Đã xóa vĩnh viễn nhóm module "${displayName}" khỏi thư viện.`, 'success');
      },
    });
  };

  // Khôi phục toàn bộ thư viện module gốc
  const handleRestoreCatalog = () => {
    setConfirmState({
      open: true,
      title: 'Khôi phục toàn bộ thư viện module gốc?',
      message: 'Toàn bộ các biến thể và nhóm module bạn từng xóa vĩnh viễn sẽ được phục hồi lại trạng thái tiêu chuẩn ban đầu.',
      onConfirm: () => {
        restoreDefaultCatalog();
        setDeletedModuleTypes([]);
        setDeletedVariants({});
        setConfirmState({ open: false });
        onShowToast?.('Đã khôi phục hoàn chỉnh thư viện module gốc.', 'success');
      },
    });
  };

  // ==============================================================
  // THAO TÁC THANH CÔNG CỤ (TOOLBAR)
  // ==============================================================
  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    if (presetId === 'custom') return;
    const p = BREAKPOINT_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setCanvasWidth(p.width);
      setCanvasHeight(p.height);
    }
  };

  const handleRotate = () => {
    const temp = canvasWidth;
    setCanvasWidth(canvasHeight);
    setCanvasHeight(temp);
    setSelectedPreset('custom');
    onShowToast?.(`Đã xoay khung: ${canvasHeight} × ${temp} px`, 'info');
  };

  const handleFitToScreen = useCallback(() => {
    if (!viewportRef.current) return;
    const availableWidth = viewportRef.current.clientWidth - 80;
    const availableHeight = viewportRef.current.clientHeight - 80;
    const scaleX = availableWidth / canvasWidth;
    const targetHeight = isHeightAuto ? 600 : canvasHeight;
    const scaleY = availableHeight / targetHeight;
    const idealScale = Math.min(scaleX, isHeightAuto ? scaleX : scaleY);
    const clamped = Math.max(0.25, Math.min(1.5, Number(idealScale.toFixed(2))));
    setZoomLevel(clamped);
    onShowToast?.(`Đã tự khớp tỉ lệ xem vừa vặn: ${Math.round(clamped * 100)}%`, 'info');
  }, [canvasWidth, canvasHeight, isHeightAuto, onShowToast]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setHistoryIndex((i) => i - 1);
      updateModules(target, false);
      onShowToast?.('Đã hoàn tác thao tác trước.', 'info');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setHistoryIndex((i) => i + 1);
      updateModules(target, false);
      onShowToast?.('Đã làm lại thao tác.', 'info');
    }
  };

  const handleRestoreDefaultLayout = () => {
    setConfirmState({
      open: true,
      title: 'Khôi phục bố cục mặc định?',
      message: 'Toàn bộ thứ tự và kiểu bố cục của các module sẽ quay về thiết lập gốc tiêu chuẩn. Dữ liệu sự kiện của bạn vẫn được giữ nguyên.',
      onConfirm: () => {
        const defaultTree = createDefaultModuleTree();
        updateModules(defaultTree);
        setSelectedModuleId(null);
        setConfirmState({ open: false });
        onShowToast?.('Đã khôi phục bố cục module mặc định.', 'success');
      },
    });
  };

  // ==============================================================
  // THAO TÁC QUẢN LÝ MODULE
  // ==============================================================
  const handleMoveModule = (index, dir) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= modules.length) return;
    if (modules[index].locked || modules[targetIdx].locked) {
      onShowToast?.('Không thể di chuyển module đang bị khóa.', 'warning');
      return;
    }
    const copy = [...modules];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    updateModules(copy);
  };

  const handleToggleHidden = (id) => {
    const copy = modules.map((m) => {
      if (m.id !== id) return m;
      return { ...m, hidden: !m.hidden };
    });
    updateModules(copy);
  };

  const handleToggleLock = (id) => {
    const copy = modules.map((m) => {
      if (m.id !== id) return m;
      return { ...m, locked: !m.locked };
    });
    updateModules(copy);
  };

  const handleDuplicateModule = (id) => {
    const targetIdx = modules.findIndex((m) => m.id === id);
    if (targetIdx === -1) return;
    const original = modules[targetIdx];
    const cloned = {
      ...original,
      id: generateId(original.type),
      name: `${original.name} (Bản sao)`,
      isMandatory: false,
    };
    const copy = [...modules];
    copy.splice(targetIdx + 1, 0, cloned);
    updateModules(copy);
    setSelectedModuleId(cloned.id);
    onShowToast?.(`Đã nhân bản "${original.name}".`, 'success');
  };

  const handleDeleteModule = (id) => {
    const target = modules.find((m) => m.id === id);
    if (!target) return;
    if (target.isMandatory) {
      onShowToast?.(`"${target.name}" là khu vực bắt buộc, không thể xóa hẳn. Bạn có thể ẩn tạm thời bằng nút con mắt.`, 'error');
      return;
    }

    setConfirmState({
      open: true,
      title: `Xóa module "${target.name}"?`,
      message: 'Module này sẽ được gỡ khỏi trang. Bạn có thể hoàn tác lại bằng nút Hoàn tác trên thanh công cụ.',
      onConfirm: () => {
        const copy = modules.filter((m) => m.id !== id);
        updateModules(copy);
        if (selectedModuleId === id) setSelectedModuleId(null);
        setConfirmState({ open: false });
        onShowToast?.(`Đã xóa module "${target.name}".`, 'info');
      },
    });
  };

  const handleAddModuleFromCatalog = (type) => {
    const newMod = createModuleInstance(type);
    const insertIdx = selectedModuleId
      ? modules.findIndex((m) => m.id === selectedModuleId) + 1
      : modules.length;

    const copy = [...modules];
    copy.splice(insertIdx, 0, newMod);
    updateModules(copy);
    setSelectedModuleId(newMod.id);
    setIsAddModalOpen(false);
    onShowToast?.(`Đã thêm module "${newMod.name}".`, 'success');
  };

  // Cập nhật thuộc tính của Module đang chọn
  const handleUpdateSelectedProp = (propPath, value) => {
    if (!selectedModuleId) return;
    const copy = modules.map((m) => {
      if (m.id !== selectedModuleId) return m;
      const updated = { ...m };

      if (propPath === 'variant') {
        updated.variant = value;
      } else if (propPath === 'name') {
        updated.name = value;
      } else if (propPath === 'dataSource') {
        updated.dataSource = value;
      } else if (propPath.startsWith('styles.')) {
        const key = propPath.split('.')[1];
        updated.styles = { ...updated.styles, [key]: value };
      } else if (propPath.startsWith('customContent.')) {
        const key = propPath.split('.')[1];
        updated.customContent = { ...updated.customContent, [key]: value };
      }

      return updated;
    });

    updateModules(copy);
  };

  // ==============================================================
  // KÉO THẢ ĐỔI KÍCH THƯỚC KHUNG (DRAG RESIZING)
  // ==============================================================
  const handleMouseDownResize = (e, edge) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: canvasWidth,
      h: canvasHeight,
      edge,
    };

    const handleMouseMove = (moveEvent) => {
      const { x, y, w, h, edge: dragEdge } = resizeStartRef.current;
      const deltaX = (moveEvent.clientX - x) / zoomLevel;
      const deltaY = (moveEvent.clientY - y) / zoomLevel;

      if (dragEdge === 'right' || dragEdge === 'corner') {
        const newW = Math.max(300, Math.min(1920, Math.round(w + deltaX)));
        setCanvasWidth(newW);
        setSelectedPreset('custom');
      }

      if (dragEdge === 'bottom' || dragEdge === 'corner') {
        const newH = Math.max(400, Math.min(1600, Math.round(h + deltaY)));
        setCanvasHeight(newH);
        setSelectedPreset('custom');
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ==============================================================
  // CHẠY QUÉT MỌI KÍCH THƯỚC (RESPONSIVE SWEEP)
  // ==============================================================
  const handleRunScan = () => {
    const res = runResponsiveScan(modules, activeEventData, activeAssets);
    setScanResult(res);
    setIsAuditOpen(true);
    setAuditTab('scan');
  };

  // Xuất file cấu trúc JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(modules, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `els-modules-${project.slug || project.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast?.('Đã xuất file cấu trúc module JSON.', 'success');
  };

  // Nhập file cấu trúc JSON
  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) throw new Error('File JSON không chứa mảng module hợp lệ.');
        updateModules(parsed);
        onShowToast?.(`Đã nhập thành công ${parsed.length} module!`, 'success');
      } catch (err) {
        onShowToast?.(`Lỗi nhập file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Mở tab xem JSON cấu trúc
  const handleOpenJsonTab = () => {
    setJsonText(JSON.stringify(modules, null, 2));
    setJsonError(null);
    setIsAuditOpen(true);
    setAuditTab('json');
  };

  const handleApplyJsonEdit = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error('Cấu trúc phải là một mảng module.');
      updateModules(parsed);
      setJsonError(null);
      onShowToast?.('Đã áp dụng thay đổi từ mã JSON.', 'success');
    } catch (err) {
      setJsonError(err.message);
    }
  };

  return (
    <div className={styles.devWorkspaceContainer}>
      {/* ============================================================ */}
      {/* 1. THANH CÔNG CỤ ĐỈNH (TOP TOOLBAR)                          */}
      {/* ============================================================ */}
      <header className={styles.devToolbar}>
        {/* Nhóm trái: Thiết bị & Kích thước */}
        <div className={styles.toolbarGroup}>
          <div className={styles.presetSelectWrapper}>
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className={styles.presetSelect}
              title="Chọn kích thước màn hình thiết bị chuẩn"
            >
              {BREAKPOINT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
              <option value="custom">Tùy chỉnh...</option>
            </select>
          </div>

          <div className={styles.dimensionInputs}>
            <input
              type="number"
              value={canvasWidth}
              onChange={(e) => {
                setCanvasWidth(Number(e.target.value) || 320);
                setSelectedPreset('custom');
              }}
              className={styles.dimInput}
              title="Chiều rộng khung (px)"
            />
            <span className={styles.dimSep}>×</span>
            <input
              type="number"
              value={canvasHeight}
              onChange={(e) => {
                setCanvasHeight(Number(e.target.value) || 400);
                setSelectedPreset('custom');
              }}
              className={styles.dimInput}
              disabled={isHeightAuto}
              title="Chiều cao khung (px)"
            />
            <span className={styles.dimUnit}>px</span>
            <button
              type="button"
              className={`${styles.toolBtn} ${isHeightAuto ? styles.activeToolBtn : ''}`}
              onClick={() => setIsHeightAuto((prev) => !prev)}
              title={isHeightAuto ? 'Chuyển sang cố định chiều cao' : 'Tự động vừa vặn theo chiều cao nội dung'}
              style={{ padding: '0 6px', fontSize: '11px', height: '26px', minWidth: '40px' }}
            >
              {isHeightAuto ? 'Auto' : 'Fix'}
            </button>
          </div>

          <button
            type="button"
            className={styles.toolBtn}
            onClick={handleRotate}
            title="Xoay ngang / dọc màn hình"
          >
            <RefreshCwIcon size={14} />
          </button>

          <span className={styles.groupDivider} />

          {/* Dải mốc Breakpoint */}
          <div className={styles.breakpointBadge}>
            <span className={styles.bpDot} />
            <strong>{currentBreakpointCategory.toUpperCase()}</strong>
          </div>
        </div>

        {/* Nhóm giữa: Dữ liệu thử nghiệm & Chế độ xem */}
        <div className={styles.toolbarGroup}>
          <div className={styles.datasetSelectWrap}>
            <label className={styles.datasetLabel}>Dữ liệu:</label>
            <select
              value={selectedDatasetKey}
              onChange={(e) => setSelectedDatasetKey(e.target.value)}
              className={`${styles.datasetSelect} ${selectedDatasetKey !== 'real' ? styles.datasetSimulated : ''}`}
            >
              {Object.values(TEST_DATASETS).map((ds) => (
                <option key={ds.id} value={ds.id}>{ds.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.datasetSelectWrap}>
            <label className={styles.datasetLabel}>Bố cục:</label>
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                if (val === 'empty') {
                  updateModules([]);
                  setSelectedModuleId(null);
                  onShowToast?.('Đã làm trống canvas để mở độc lập từng module.', 'info');
                } else {
                  const newTree = createPresetModuleTree(val);
                  updateModules(newTree);
                  setSelectedModuleId(null);
                  onShowToast?.(`Đã áp dụng mẫu bố cục ${PRESET_TEMPLATES[val]?.name}`, 'success');
                }
              }}
              className={styles.datasetSelect}
            >
              <option value="">-- Mẫu bố cục ({Object.keys(PRESET_TEMPLATES).length} presets) --</option>
              {Object.values(PRESET_TEMPLATES).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="empty">Trống (Mở độc lập từng module)</option>
            </select>
          </div>

          <span className={styles.groupDivider} />

          {/* Phóng to / Thu nhỏ */}
          <div className={styles.zoomControls}>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
              title="Thu nhỏ"
            >
              −
            </button>
            <span className={styles.zoomVal}>{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
              title="Phóng to"
            >
              +
            </button>
          </div>

          {/* Khung viền trang trí */}
          <button
            type="button"
            className={`${styles.toolBtn} ${showBezel ? styles.toolBtnActive : ''}`}
            onClick={() => setShowBezel(!showBezel)}
            title="Bật/tắt viền vỏ thiết bị"
          >
            {canvasWidth < 768 ? <PhoneIcon size={15} /> : <LaptopIcon size={15} />}
          </button>
        </div>

        {/* Nhóm phải: Hoàn tác, Scan, Xuất/Nhập & Thoát */}
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Hoàn tác (Undo)"
          >
            ↶
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Làm lại (Redo)"
          >
            ↷
          </button>

          <span className={styles.groupDivider} />

          <button
            type="button"
            className={styles.btnScanSweep}
            onClick={handleRunScan}
            title="Tự động kiểm tra trên 5 độ phân giải"
          >
            <SparklesIcon size={14} />
            <span>Quét mọi kích thước</span>
          </button>

          <button
            type="button"
            className={styles.btnJsonCode}
            onClick={handleOpenJsonTab}
            title="Xem mã cấu trúc JSON"
          >
            {'{}'}
          </button>

          <button
            type="button"
            className={styles.toolBtn}
            onClick={handleExportJson}
            title="Tải file cấu trúc JSON"
          >
            <DownloadIcon size={14} />
          </button>

          <label className={styles.toolBtn} title="Nhập file JSON cấu trúc">
            <UploadIcon size={14} />
            <input type="file" accept=".json" onChange={handleImportJsonFile} style={{ display: 'none' }} />
          </label>

          <button
            type="button"
            className={styles.toolBtnDanger}
            onClick={handleRestoreDefaultLayout}
            title="Khôi phục bố cục mặc định"
          >
            <RefreshCwIcon size={14} />
          </button>

          <span className={styles.groupDivider} />

          
          <button
            type="button"
            className={styles.btnReviewLogToolbar}
            onClick={() => setIsReviewModalOpen(true)}
            title="Mở nhật ký đánh giá và phê duyệt module"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <FileTextIcon size={14} />
              <span>Nhật ký đánh giá</span>
            </span>
            {reviewStats.accepted > 0 && (
              <span className={styles.reviewToolbarBadge}>✓ {reviewStats.accepted}</span>
            )}
            {reviewStats.rejected > 0 && (
              <span className={styles.reviewToolbarBadgeRejected}>✗ {reviewStats.rejected}</span>
            )}
          </button>

          {reviewStats.accepted > 0 && (
            <button
              type="button"
              className={styles.btnApplyAcceptedToolbar}
              onClick={handleKeepAcceptedOnly}
              title="Chỉ giữ lại các module đã được bạn phê duyệt chấp nhận, loại bỏ toàn bộ các module khác"
            >
              <CheckIcon size={13} />
              <span>Chỉ giữ module chấp nhận ({reviewStats.accepted})</span>
            </button>
          )}

          <button
            type="button"
            className={styles.btnExitDevMode}
            onClick={onExitDevMode}
            title="Quay lại chế độ xem thường"
          >
            Thoát Dev Mode
          </button>
        </div>
      </header>

      {/* Dải thông báo khi đang xem dữ liệu thử nghiệm */}
      {selectedDatasetKey !== 'real' && (
        <div className={styles.simulatedDataBanner} role="status">
          <AlertCircleIcon size={14} />
          <span>
            Đang mô phỏng với <strong>{TEST_DATASETS[selectedDatasetKey].label}</strong>: {TEST_DATASETS[selectedDatasetKey].description}. Dữ liệu thật của dự án không bị thay đổi.
          </span>
          <button
            type="button"
            className={styles.btnExitSim}
            onClick={() => setSelectedDatasetKey('real')}
          >
            Về dữ liệu thật
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. KHÔNG GIAN CHÍNH: 3 CỘT (TREE | CANVAS | INSPECTOR)       */}
      {/* ============================================================ */}
      <div className={styles.devMainLayout}>
        {/* CỘT TRÁI: DANH MỤC MODULE */}
        <aside className={styles.moduleTreeSidebar} aria-label="Danh mục module">
          <div className={styles.treeHeader}>
            <div>
              <h3 className={styles.treeTitle}>Thư viện Module ({filteredCatalog.length})</h3>
              <p className={styles.treeSub}>Chọn để mở kiểm thử độc lập</p>
              {(deletedModuleTypes.length > 0 || Object.values(deletedVariants).flat().length > 0) && (
                <button
                  type="button"
                  className={styles.btnRestoreCatalog}
                  onClick={handleRestoreCatalog}
                  title="Khôi phục các nhóm và biến thể module đã xóa vĩnh viễn"
                >
                  ↺ Khôi phục ({deletedModuleTypes.length} nhóm, {Object.values(deletedVariants).flat().length} biến thể)
                </button>
              )}
            </div>
            {modules.length > 0 && (
              <button
                type="button"
                className={styles.btnClearCanvas}
                onClick={handleClearModules}
                title="Làm rỗng khung và quay lại danh mục"
              >
                ✕ Làm rỗng
              </button>
            )}
          </div>

          <div className={styles.catalogSearchWrap}>
            <SearchIcon size={14} />
            <input
              type="text"
              placeholder="Tìm theo tên module..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className={styles.catalogSearchInput}
            />
          </div>

          <div className={styles.catalogList}>
            {filteredCatalog.map((item) => {
              const isLoaded = modules.some((m) => m.type === item.type);
              return (
                <div
                  key={item.type}
                  className={`${styles.catalogItem} ${isLoaded ? styles.catalogItemActive : ''}`}
                  onClick={() => handleOpenSingleModule(item.type)}
                >
                  <div className={styles.catalogItemLeft}>
                    <div className={styles.catalogItemMeta}>
                      <div className={styles.catalogItemTitleRow}>
                        <span className={styles.catalogItemName}>{item.name}</span>
                        {isLoaded && <span className={styles.activePill}>Đang mở</span>}
                      </div>
                      <span className={styles.catalogItemCategory}>
                        {item.category} · {item.variants.length} biến thể
                      </span>
                    </div>
                  </div>

                  <div className={styles.catalogItemActions}>
                    <button
                      type="button"
                      className={styles.catalogBtnAdd}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppendModule(item.type);
                      }}
                      title="Ghép thêm module này"
                    >
                      <PlusIcon size={12} />
                    </button>
                    <button
                      type="button"
                      className={styles.catalogBtnDeleteType}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModuleTypePermanently(item.type, item.name);
                      }}
                      title={`Xóa vĩnh viễn nhóm module "${item.name}"`}
                    >
                      <TrashIcon size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {modules.length > 1 && (
            <div className={styles.treeList} style={{ borderTop: '1px solid #334155', maxHeight: '180px' }}>
              {modules.map((m, idx) => {
                const isSel = m.id === selectedModuleId;
                return (
                  <div
                    key={m.id}
                    className={`${styles.treeItem} ${isSel ? styles.activeTreeItem : ''} ${m.hidden ? styles.hiddenTreeItem : ''}`}
                    onClick={() => setSelectedModuleId(m.id)}
                  >
                    <div className={styles.treeItemLeft}>
                      <span className={styles.treeIndex}>{idx + 1}</span>
                      <div className={styles.treeMeta}>
                        <span className={styles.treeItemName}>{m.name}</span>
                        <span className={styles.treeItemVariant}>{m.variant}</span>
                      </div>
                    </div>

                    <div className={styles.treeItemActions} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.treeActionBtn}
                        onClick={() => handleToggleLock(m.id)}
                        title={m.locked ? 'Mở khóa module' : 'Khóa module'}
                      >
                        {m.locked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
                      </button>
                      <button
                        type="button"
                        className={styles.treeActionBtn}
                        onClick={() => handleToggleHidden(m.id)}
                        title={m.hidden ? 'Hiện module' : 'Ẩn module'}
                      >
                        <EyeIcon size={13} className={m.hidden ? styles.mutedIcon : ''} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0 || m.locked}
                        className={styles.treeActionBtn}
                        onClick={() => handleMoveModule(idx, -1)}
                        title="Di chuyển lên"
                      >
                        <MoveUpIcon size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === modules.length - 1 || m.locked}
                        className={styles.treeActionBtn}
                        onClick={() => handleMoveModule(idx, 1)}
                        title="Di chuyển xuống"
                      >
                        <MoveDownIcon size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* CỘT GIỮA: KHU VỰC CỐ ĐỊNH CHỨA THANH KÉO VÀ CANVAS VIEWPORT */}
        <div className={styles.canvasCenterCol}>
          {/* THANH KÉO GIÁ TRỊ TỈ LỆ & ĐỘ PHÂN GIẢI */}
          <div className={styles.dualSliderBar}>
            {/* THANH KÉO 1: ĐỘ PHÂN GIẢI */}
            <div className={styles.sliderControlBlock}>
              <div className={styles.sliderHeaderRow}>
                <div className={styles.sliderTitle}>
                  <SparklesIcon size={14} className={styles.sliderIcon} />
                  <strong>Độ phân giải:</strong>
                  <span className={styles.sliderValueBadge}>{canvasWidth} px</span>
                  <span className={styles.bpCategoryBadge}>{currentBreakpointCategory.toUpperCase()}</span>
                </div>
                <div className={styles.quickPresetTags}>
                  {[
                    { label: '320 (Mini)', w: 320, h: 568 },
                    { label: '375 (Mobile)', w: 375, h: 667 },
                    { label: '414 (Plus)', w: 414, h: 896 },
                    { label: '768 (Tablet)', w: 768, h: 1024 },
                    { label: '1024 (iPad)', w: 1024, h: 768 },
                    { label: '1280 (Laptop)', w: 1280, h: 800 },
                    { label: '1440 (Desktop)', w: 1440, h: 900 },
                    { label: '1920 (FHD)', w: 1920, h: 1080 },
                  ].map((item) => (
                    <button
                      key={item.w}
                      type="button"
                      className={`${styles.btnPresetTag} ${canvasWidth === item.w ? styles.btnPresetActive : ''}`}
                      onClick={() => {
                        setCanvasWidth(item.w);
                        if (!isHeightAuto) setCanvasHeight(item.h);
                        setSelectedPreset('custom');
                      }}
                      title={`Chuyển nhanh sang độ phân giải ${item.label}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.sliderTrackRow}>
                <span className={styles.sliderBoundaryLabel}>320px</span>
                <input
                  type="range"
                  min="320"
                  max="1920"
                  step="1"
                  value={canvasWidth}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    setCanvasWidth(w);
                    setSelectedPreset('custom');
                    if (!isHeightAuto) {
                      if (w <= 480) {
                        setCanvasHeight(Math.round(w * 1.78));
                      } else if (w <= 820) {
                        setCanvasHeight(Math.round(w * 1.33));
                      } else {
                        setCanvasHeight(Math.round(w * 0.625));
                      }
                    }
                  }}
                  className={styles.rangeInputResolution}
                  title={`Kéo để đổi độ phân giải: ${canvasWidth}px`}
                />
                <span className={styles.sliderBoundaryLabel}>1920px</span>
              </div>
            </div>

            {/* THANH KÉO 2: TỈ LỆ HIỂN THỊ (SCALE) */}
            <div className={styles.sliderControlBlock}>
              <div className={styles.sliderHeaderRow}>
                <div className={styles.sliderTitle}>
                  <SearchIcon size={14} className={styles.sliderIcon} />
                  <strong>Tỉ lệ xem (Scale):</strong>
                  <span className={styles.sliderValueBadge}>{Math.round(zoomLevel * 100)}%</span>
                </div>
                <div className={styles.quickPresetTags}>
                  <button
                    type="button"
                    className={`${styles.btnPresetTag} ${styles.btnFitTag}`}
                    onClick={handleFitToScreen}
                    title="Tự động thu phóng để toàn bộ màn hình vừa khít vùng xem cố định"
                  >
                    <CheckIcon size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} /> Vừa vặn (Fit)
                  </button>
                  {[
                    { label: '50%', val: 0.5 },
                    { label: '75%', val: 0.75 },
                    { label: '100%', val: 1.0 },
                    { label: '125%', val: 1.25 },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`${styles.btnPresetTag} ${Math.abs(zoomLevel - item.val) < 0.03 ? styles.btnPresetActive : ''}`}
                      onClick={() => setZoomLevel(item.val)}
                      title={`Tỉ lệ ${item.label}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.sliderTrackRow}>
                <span className={styles.sliderBoundaryLabel}>25%</span>
                <input
                  type="range"
                  min="25"
                  max="150"
                  step="1"
                  value={Math.round(zoomLevel * 100)}
                  onChange={(e) => setZoomLevel(Number(e.target.value) / 100)}
                  className={styles.rangeInputScale}
                  title={`Kéo để đổi tỉ lệ hiển thị: ${Math.round(zoomLevel * 100)}%`}
                />
                <span className={styles.sliderBoundaryLabel}>150%</span>
              </div>
            </div>
          </div>

          {/* THANH ĐIỀU KHIỂN CHỦ ĐỀ & XEN KẼ MÀU NỀN TRONG DEV MODE */}
          <div className={styles.devThemeControlBar}>
            <div className={styles.devThemePillGroup}>
              <span className={styles.devThemeBarLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <PaletteIcon size={14} />
                <span>Màu chủ đạo:</span>
              </span>
              {COLOR_THEMES.map((th) => {
                const isCur = devThemeColor === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    className={`${styles.devThemeColorBtn} ${isCur ? styles.devThemeColorBtnActive : ''}`}
                    onClick={() => {
                      setDevThemeColor(th.id);
                      onShowToast?.(`Dev Mode: Đổi màu chủ đạo sang ${th.name}`, 'info');
                    }}
                    title={`${th.name}: ${th.desc}`}
                  >
                    <span className={styles.devThemeDot} style={{ backgroundColor: th.hex }} />
                    <span className={styles.devThemeText}>{th.name}</span>
                  </button>
                );
              })}
            </div>

            <label className={styles.devAlternatingToggle}>
              <input
                type="checkbox"
                checked={devAlternatingBg}
                onChange={(e) => {
                  setDevAlternatingBg(e.target.checked);
                  onShowToast?.(e.target.checked ? 'Đã bật xen kẽ màu nền module' : 'Đã tắt xen kẽ (nền đồng nhất)', 'info');
                }}
              />
              <span>Xen kẽ màu nền module</span>
            </label>
          </div>

          <main className={styles.canvasViewportArea} ref={viewportRef} onClick={() => setSelectedModuleId(null)}>
          {modules.length === 0 ? (
            <div className={styles.emptySandboxContainer}>
              <div className={styles.emptySandboxCard}>
                <div className={styles.emptySandboxHero}>
                  <div className={styles.emptySandboxBadge}>PHÒNG TEST MODULE ĐỘC LẬP</div>
                  <h2 className={styles.emptySandboxTitle}>Chọn một Module để mở kiểm thử độc lập</h2>
                  <p className={styles.emptySandboxSub}>
                    Khung làm việc đang rỗng. Mỗi module bên dưới đã được trang bị sẵn ảnh mẫu, tiêu đề mẫu và nội dung mẫu hoàn chỉnh. Hãy chọn bất kỳ module nào để xem trước bố cục, đổi biến thể, thử màu sắc và co giãn kích thước độc lập mà không ảnh hưởng tới dự án.
                  </p>
                </div>

                <div className={styles.sandboxModuleGrid}>
                  {filteredCatalog.map((modItem) => (
                    <div
                      key={modItem.type}
                      className={styles.sandboxGridCard}
                      onClick={() => handleOpenSingleModule(modItem.type)}
                    >
                      <div className={styles.sandboxCardTop}>
                        <span className={styles.sandboxCatBadge}>{modItem.category}</span>
                        <span className={styles.sandboxVariantCount}>{modItem.variants.length} biến thể</span>
                      </div>
                      <h4 className={styles.sandboxCardName}>{modItem.name}</h4>
                      <p className={styles.sandboxCardDesc}>{modItem.description}</p>
                      <div className={styles.sandboxCardAction}>
                        <span className={styles.btnLaunchSandbox}>Mở kiểm thử độc lập ➔</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dải thông báo module đang mở */}
              <div className={styles.canvasActivePillBar}>
                <div className={styles.canvasPillInfo}>
                  <span className={styles.pillPulseDot} />
                  <span>
                    Đang thử nghiệm độc lập: <strong>{modules[0]?.name}</strong> ({modules[0]?.variant})
                  </span>
                </div>
                <div className={styles.canvasPillActions}>
                  <button
                    type="button"
                    className={styles.btnPillAction}
                    onClick={handleClearModules}
                    title="Đóng module này và quay lại danh mục chọn module khác"
                  >
                    ✕ Đóng / Đổi module
                  </button>
                </div>
              </div>

              <div
                className={styles.canvasScaleContainer}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              >
                <div
                  className={`${styles.canvasDeviceFrame} ${isResizing ? styles.canvasResizing : ''} ${showBezel && canvasWidth < 768 ? styles.bezelPhone : ''} ${showBezel && canvasWidth >= 768 ? styles.bezelLaptop : ''}`}
                  style={{
                    width: `${canvasWidth}px`,
                    height: isHeightAuto ? 'auto' : `${canvasHeight}px`,
                  }}
                >
                  {/* Thước đo kích thước phía trên khung */}
                  <div className={styles.dimensionBadgeOnFrame}>
                    {canvasWidth} × {canvasHeight} px ({currentBreakpointCategory})
                  </div>

                  {/* Vùng cuộn nội dung landing page */}
                  <div className={styles.canvasScrollContent}>
                    {modules.map((m, idx) => (
                      <ModuleRenderer
                        key={m.id}
                        module={m}
                        index={idx}
                        themeColor={devThemeColor}
                        isAlternating={devAlternatingBg}
                        eventData={activeEventData}
                        aiData={activeAiData}
                        formFields={activeFormFields}
                        assets={activeAssets}
                        isSelected={selectedModuleId === m.id}
                        review={reviews[m.id] || null}
                        onSetReviewStatus={(status) => handleSetReviewStatus(m, status)}
                        onOpenReviewComment={() => setSelectedModuleId(m.id)}
                        isDevMode={true}
                        onSelect={(id) => setSelectedModuleId(id)}
                        onMoveUp={() => handleMoveModule(idx, -1)}
                        onMoveDown={() => handleMoveModule(idx, 1)}
                        onDuplicate={() => handleDuplicateModule(m.id)}
                        onDelete={() => handleDeleteModule(m.id)}
                      />
                    ))}
                  </div>

                  {/* Tay nắm kéo đổi kích thước (Resize Handles) */}
                  <div
                    className={styles.handleRight}
                    onMouseDown={(e) => handleMouseDownResize(e, 'right')}
                    title="Kéo sang ngang để đổi chiều rộng"
                  />
                  {!isHeightAuto && (
                    <div
                      className={styles.handleBottom}
                      onMouseDown={(e) => handleMouseDownResize(e, 'bottom')}
                      title="Kéo xuống dưới để đổi chiều cao"
                    />
                  )}
                  {!isHeightAuto && (
                    <div
                      className={styles.handleCorner}
                      onMouseDown={(e) => handleMouseDownResize(e, 'corner')}
                      title="Kéo góc để đổi cả chiều rộng và chiều cao"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </main>
        </div>

        {/* CỘT PHẢI: BẢNG THUỘC TÍNH (PROPERTY INSPECTOR) */}
        <aside className={styles.inspectorSidebar} aria-label="Bảng thuộc tính">
          {selectedModule ? (
            <div className={styles.inspectorInner}>
              <div className={styles.inspectorHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <span className={styles.inspPre}>Thuộc tính module</span>
                    <h3 className={styles.inspTitle}>{selectedModule.name}</h3>
                    <span className={styles.inspTypeBadge}>Loại: {selectedModule.type}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.btnDeleteTypeInspector}
                    onClick={() => handleDeleteModuleTypePermanently(selectedModule.type, selectedModule.name)}
                    title={`Xóa vĩnh viễn cả nhóm module "${selectedModule.name}" khỏi thư viện`}
                  >
                    <TrashIcon size={12} />
                    <span>Xóa nhóm</span>
                  </button>
                </div>
              </div>

              
              {/* Nhóm Đánh giá & Ghi chép Module */}
              <div className={styles.reviewSectionBox}>
                <label className={styles.propSectionTitle} style={{ color: '#818cf8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Đánh giá & Ghi chép Module</span>
                  {reviews[selectedModule.id]?.status === 'accepted' && (
                    <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 700 }}>✓ ĐÃ CHẤP NHẬN</span>
                  )}
                  {reviews[selectedModule.id]?.status === 'rejected' && (
                    <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 700 }}>✗ ĐÃ LOẠI BỎ</span>
                  )}
                </label>

                <div className={styles.reviewStatusGroup}>
                  <button
                    type="button"
                    className={`${styles.btnStatusAccept} ${reviews[selectedModule.id]?.status === 'accepted' ? styles.btnStatusActiveAccept : ''}`}
                    onClick={() => handleSetReviewStatus(selectedModule, reviews[selectedModule.id]?.status === 'accepted' ? 'pending' : 'accepted')}
                  >
                    ✓ Chấp nhận
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnStatusReject} ${reviews[selectedModule.id]?.status === 'rejected' ? styles.btnStatusActiveReject : ''}`}
                    onClick={() => handleSetReviewStatus(selectedModule, reviews[selectedModule.id]?.status === 'rejected' ? 'pending' : 'rejected')}
                  >
                    ✗ Loại bỏ
                  </button>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>
                    Nhận xét & Đề xuất cải tiến:
                  </label>
                  <textarea
                    className={styles.reviewCommentTextarea}
                    rows={3}
                    placeholder="Ghi chú về bố cục, màu sắc, chữ viết hoặc lỗi hiển thị để cải tiến..."
                    value={reviews[selectedModule.id]?.comment || ''}
                    onChange={(e) => handleUpdateReviewComment(selectedModule, e.target.value)}
                  />
                  <div className={styles.quickTagChips}>
                    {['📐 Bố cục đẹp', '📱 Lỗi mobile', '🎨 Màu sắc', '✍ Cần sửa chữ', '⚡ Tải chậm', '✨ Hoàn hảo'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={styles.btnQuickTag}
                        onClick={() => {
                          const old = reviews[selectedModule.id]?.comment || '';
                          const next = old ? `${old} [${tag}]` : `[${tag}] `;
                          handleUpdateReviewComment(selectedModule, next);
                        }}
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                  {reviews[selectedModule.id]?.updatedAt && (
                    <span className={styles.reviewTimestamp}>
                      Cập nhật: {reviews[selectedModule.id].updatedAt}
                    </span>
                  )}
                </div>
              </div>

              {/* Nhóm 1: Kiểu bố cục (Variant) */}
              <div className={styles.propSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className={styles.propSectionTitle} style={{ margin: 0 }}>Kiểu bố cục (Variant)</label>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {(activeCatalog[selectedModule.type]?.variants || []).length} biến thể
                  </span>
                </div>
                <div className={styles.variantOptionsGrid}>
                  {(activeCatalog[selectedModule.type]?.variants || []).map((v) => {
                    const isSelectedVar = selectedModule.variant === v.id;
                    const canDeleteVar = (activeCatalog[selectedModule.type]?.variants || []).length > 1;
                    return (
                      <div
                        key={v.id}
                        className={styles.variantCardWrap}
                      >
                        <button
                          type="button"
                          className={`${styles.variantCard} ${isSelectedVar ? styles.activeVariantCard : ''}`}
                          onClick={() => handleUpdateSelectedProp('variant', v.id)}
                        >
                          <span className={styles.variantCardName}>{v.label}</span>
                        </button>
                        {canDeleteVar && (
                          <button
                            type="button"
                            className={styles.btnDeleteVariantPerm}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVariantPermanently(selectedModule.type, v.id, v.label);
                            }}
                            title={`Xóa vĩnh viễn biến thể "${v.label}"`}
                            aria-label={`Xóa biến thể ${v.label}`}
                          >
                            <TrashIcon size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nhóm 2: Nguồn dữ liệu (Data Binding) */}
              <div className={styles.propSection}>
                <label className={styles.propSectionTitle}>Nguồn dữ liệu</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="dataSource"
                      checked={selectedModule.dataSource === 'auto'}
                      onChange={() => handleUpdateSelectedProp('dataSource', 'auto')}
                    />
                    <span>Tự động (từ WS1, WS2, AI)</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="dataSource"
                      checked={selectedModule.dataSource === 'custom'}
                      onChange={() => handleUpdateSelectedProp('dataSource', 'custom')}
                    />
                    <span>Nhập nội dung riêng (Override)</span>
                  </label>
                </div>

                {selectedModule.dataSource === 'custom' && (
                  <div className={styles.customContentInputs}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Tiêu đề riêng</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={selectedModule.customContent?.headline || ''}
                        onChange={(e) => handleUpdateSelectedProp('customContent.headline', e.target.value)}
                        placeholder="Nhập tiêu đề riêng cho module..."
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Mô tả riêng</label>
                      <textarea
                        rows={2}
                        className={styles.textarea}
                        value={selectedModule.customContent?.description || ''}
                        onChange={(e) => handleUpdateSelectedProp('customContent.description', e.target.value)}
                        placeholder="Nhập mô tả riêng..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Nhóm 3: Kiểu dáng & Khoảng cách */}
              <div className={styles.propSection}>
                <label className={styles.propSectionTitle}>Kiểu dáng & Khoảng cách</label>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Khoảng cách đệm (Padding)</label>
                  <select
                    className={styles.select}
                    value={selectedModule.styles?.padding || 'normal'}
                    onChange={(e) => handleUpdateSelectedProp('styles.padding', e.target.value)}
                  >
                    <option value="compact">Gọn nhẹ (Compact · 24px)</option>
                    <option value="normal">Tiêu chuẩn (Normal · 48px)</option>
                    <option value="spacious">Rộng rãi (Spacious · 72px)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Màu nền (Background)</label>
                  <select
                    className={styles.select}
                    value={selectedModule.styles?.background || 'default'}
                    onChange={(e) => handleUpdateSelectedProp('styles.background', e.target.value)}
                  >
                    <option value="default">Mặc định (Trắng sáng)</option>
                    <option value="surface">Xám nhạt (Surface #f8fafc)</option>
                    <option value="alt">Xám đậm nhẹ (#f1f5f9)</option>
                    <option value="primary">Màu chủ đạo (Gradient tím/chàm)</option>
                    <option value="dark">Tối sang trọng (#0f172a)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyInspector}>
              <p className={styles.emptyInspTitle}>Chưa chọn module nào</p>
              <p className={styles.emptyInspSub}>
                Nhấp vào bất kỳ module nào trên màn hình hoặc trong danh sách bên trái để chỉnh sửa kiểu bố cục, nội dung và khoảng cách.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ============================================================ */}
      {/* 3. NGĂN KÉO DƯỚI ĐÁY: CHẨN ĐOÁN & KIỂM TRA (AUDIT DRAWER)      */}
      {/* ============================================================ */}
      <footer className={styles.auditDrawer}>
        <div className={styles.auditBarHeader}>
          <div className={styles.auditBarLeft} onClick={() => setIsAuditOpen(!isAuditOpen)}>
            <span className={`${styles.auditStatusDot} ${currentAuditIssues.some((i) => i.level === 'error') ? styles.dotError : styles.dotOk}`} />
            <strong className={styles.auditBarTitle}>
              Kiểm tra tự động: {currentAuditIssues.length === 0 ? 'Tất cả tiêu chuẩn đều đạt ✔' : `${currentAuditIssues.length} lưu ý`}
            </strong>
            <span className={styles.auditChevron}>{isAuditOpen ? '▼ Đóng' : '▲ Mở kiểm tra'}</span>
          </div>

          <div className={styles.auditBarTabs}>
            <button
              type="button"
              className={`${styles.auditTabBtn} ${auditTab === 'issues' && isAuditOpen ? styles.activeAuditTab : ''}`}
              onClick={() => { setAuditTab('issues'); setIsAuditOpen(true); }}
            >
              Cảnh báo ({currentAuditIssues.length})
            </button>
            <button
              type="button"
              className={`${styles.auditTabBtn} ${auditTab === 'scan' && isAuditOpen ? styles.activeAuditTab : ''}`}
              onClick={() => { handleRunScan(); }}
            >
              Báo cáo quét 5 kích thước
            </button>
            <button
              type="button"
              className={`${styles.auditTabBtn} ${auditTab === 'json' && isAuditOpen ? styles.activeAuditTab : ''}`}
              onClick={handleOpenJsonTab}
            >
              Mã JSON cấu trúc
            </button>
          </div>
        </div>

        {isAuditOpen && (
          <div className={styles.auditDrawerBody}>
            {/* Tab 1: Danh sách cảnh báo */}
            {auditTab === 'issues' && (
              <div className={styles.issuesList}>
                {currentAuditIssues.length === 0 ? (
                  <p className={styles.allPassedMsg}>
                    🎉 Tuyệt vời! Không phát hiện lỗi tràn khung, thiếu khu vực bắt buộc hay bất hợp lý nào ở kích thước {canvasWidth}px.
                  </p>
                ) : (
                  currentAuditIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`${styles.issueRow} ${issue.level === AUDIT_LEVELS.ERROR ? styles.rowError : issue.level === AUDIT_LEVELS.WARNING ? styles.rowWarning : styles.rowSuggestion}`}
                      onClick={() => { if (issue.moduleId) setSelectedModuleId(issue.moduleId); }}
                    >
                      <span className={styles.issueLevelBadge}>{issue.level.toUpperCase()}</span>
                      <div className={styles.issueContent}>
                        <strong>{issue.title}</strong>
                        <p>{issue.message}</p>
                        <span className={styles.fixHint}>💡 Khắc phục: {issue.fixSuggestion}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Báo cáo quét 5 kích thước */}
            {auditTab === 'scan' && scanResult && (
              <div className={styles.scanReportWrapper}>
                <div className={styles.scanHeader}>
                  <h4>Báo cáo kiểm tra đa độ phân giải</h4>
                  <button
                    type="button"
                    className={styles.btnExportReport}
                    onClick={() => exportAuditReport(scanResult, project.name)}
                  >
                    <DownloadIcon size={14} />
                    <span>Tải file báo cáo (.md)</span>
                  </button>
                </div>

                <div className={styles.scanCardsGrid}>
                  {scanResult.resultsByBreakpoint.map((bp) => (
                    <div key={bp.width} className={`${styles.scanBpCard} ${bp.status === 'pass' ? styles.bpPass : bp.status === 'warning' ? styles.bpWarn : styles.bpFail}`}>
                      <div className={styles.bpTop}>
                        <strong>{bp.name}</strong>
                        <span className={styles.bpStatusText}>{bp.status === 'pass' ? '✔ ĐẠT' : `${bp.issues.length} VẤN ĐỀ`}</span>
                      </div>
                      <div className={styles.bpIssuesMini}>
                        {bp.issues.length === 0 ? (
                          <span className={styles.textMuted}>Hiển thị hoàn hảo, không có lỗi</span>
                        ) : (
                          bp.issues.map((iss, i) => (
                            <span key={i} className={styles.miniIssueTag}>• {iss.title}</span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Chỉnh sửa JSON cấu trúc */}
            {auditTab === 'json' && (
              <div className={styles.jsonEditorWrap}>
                <div className={styles.jsonHeader}>
                  <span>Xem và chỉnh sửa trực tiếp mảng cấu trúc module (JSON)</span>
                  <button
                    type="button"
                    className={styles.btnApplyJson}
                    onClick={handleApplyJsonEdit}
                  >
                    Áp dụng thay đổi JSON
                  </button>
                </div>
                {jsonError && <p className={styles.jsonErrorText}>❌ {jsonError}</p>}
                <textarea
                  className={styles.jsonTextarea}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={8}
                />
              </div>
            )}
          </div>
        )}
      </footer>

      {/* ============================================================ */}
      {/* 4. MODAL: THƯ VIỆN MODULE (MODULE CATALOG)                   */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.catalogModalBox}>
            <div className={styles.catalogHeader}>
              <div>
                <h3 className={styles.catalogTitle}>Thư viện Module Landing Page</h3>
                <p className={styles.catalogSub}>Chọn module để thêm vào vị trí sau module đang chọn</p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsAddModalOpen(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className={styles.catalogSearchWrap}>
              <SearchIcon size={16} className={styles.catalogSearchIcon} />
              <input
                type="text"
                placeholder="Tìm kiếm module theo tên hoặc mô tả..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className={styles.catalogSearchInput}
                autoFocus
              />
            </div>

            <div className={styles.catalogGrid}>
              {filteredCatalog.map((item) => (
                <div
                  key={item.type}
                  className={styles.catalogCard}
                  onClick={() => handleAddModuleFromCatalog(item.type)}
                >
                  <div className={styles.catalogCardTop}>
                    <span className={styles.catalogCategoryBadge}>{item.category}</span>
                    {item.isMandatory && <span className={styles.mandatoryBadge}>Bắt buộc</span>}
                  </div>
                  <h4 className={styles.catalogCardName}>{item.name}</h4>
                  <p className={styles.catalogCardDesc}>{item.description}</p>
                  <span className={styles.variantsCount}>{item.variants.length} kiểu bố cục hỗ trợ</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      
      {/* ============================================================ */}
      {/* MODAL: NHẬT KÝ ĐÁNH GIÁ MODULE (REVIEW LOG MODAL)            */}
      {/* ============================================================ */}
      {isReviewModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.reviewModalBox}>
            <div className={styles.reviewModalHeader}>
              <div>
                <h3 className={styles.reviewModalTitle}>Nhật ký đánh giá & Phê duyệt Module</h3>
                <p className={styles.reviewModalSub}>
                  Ghi chép danh sách các module được chấp nhận, loại bỏ và nhận xét để cải tiến hệ thống
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsReviewModalOpen(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Hàng thống kê tổng quan */}
            <div className={styles.reviewStatsRow}>
              <div className={styles.reviewStatCard}>
                <div className={styles.reviewStatNum} style={{ color: '#818cf8' }}>{reviewStats.total}</div>
                <div className={styles.reviewStatLabel}>Đã đánh giá</div>
              </div>
              <div className={styles.reviewStatCard}>
                <div className={styles.reviewStatNum} style={{ color: '#34d399' }}>{reviewStats.accepted}</div>
                <div className={styles.reviewStatLabel}>Đã chấp nhận</div>
              </div>
              <div className={styles.reviewStatCard}>
                <div className={styles.reviewStatNum} style={{ color: '#f87171' }}>{reviewStats.rejected}</div>
                <div className={styles.reviewStatLabel}>Đã loại bỏ</div>
              </div>
              <div className={styles.reviewStatCard}>
                <div className={styles.reviewStatNum} style={{ color: '#fbbf24' }}>{reviewStats.commented}</div>
                <div className={styles.reviewStatLabel}>Có nhận xét</div>
              </div>
            </div>

            {/* Hộp hành động nhanh áp dụng theo đánh giá */}
            <div className={styles.reviewApplyBox}>
              <div>
                <strong style={{ color: '#ffffff', fontSize: '0.95rem', display: 'block' }}>
                  Áp dụng quyết định đánh giá
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Giữ lại <strong>{reviewStats.accepted}</strong> module đã chấp nhận, loại bỏ toàn bộ các module không được chấp nhận.
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={styles.btnKeepAcceptedAction}
                  onClick={handleKeepAcceptedOnly}
                  disabled={reviewStats.accepted === 0}
                >
                  ✓ Chỉ giữ module chấp nhận
                </button>
                {_onUpdateProject && (
                  <button
                    type="button"
                    className={styles.btnApplyToLandingAction}
                    onClick={handleApplyAcceptedToLanding}
                    disabled={reviewStats.accepted === 0}
                  >
                    🚀 Đưa vào Landing Page
                  </button>
                )}
              </div>
            </div>

            {/* Thanh lọc trạng thái */}
            <div className={styles.reviewFilterBar}>
              <button
                type="button"
                className={`${styles.reviewFilterPill} ${reviewFilter === 'all' ? styles.reviewFilterPillActive : ''}`}
                onClick={() => setReviewFilter('all')}
              >
                Tất cả ({reviewStats.total})
              </button>
              <button
                type="button"
                className={`${styles.reviewFilterPill} ${reviewFilter === 'accepted' ? styles.reviewFilterPillActive : ''}`}
                onClick={() => setReviewFilter('accepted')}
              >
                ✓ Chấp nhận ({reviewStats.accepted})
              </button>
              <button
                type="button"
                className={`${styles.reviewFilterPill} ${reviewFilter === 'rejected' ? styles.reviewFilterPillActive : ''}`}
                onClick={() => setReviewFilter('rejected')}
              >
                ✗ Loại bỏ ({reviewStats.rejected})
              </button>
              <button
                type="button"
                className={`${styles.reviewFilterPill} ${reviewFilter === 'commented' ? styles.reviewFilterPillActive : ''}`}
                onClick={() => setReviewFilter('commented')}
              >
                💬 Có nhận xét ({reviewStats.commented})
              </button>
            </div>

            {/* Danh sách các bản ghi */}
            <div className={styles.reviewListWrap}>
              {filteredReviewList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>Chưa có ghi chép nào phù hợp bộ lọc.</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem' }}>
                    Hãy chọn từng module trên màn hình để tích Chấp nhận, Loại bỏ hoặc viết nhận xét.
                  </p>
                </div>
              ) : (
                filteredReviewList.map((item, idx) => (
                  <div key={item.moduleId || idx} className={styles.reviewRowItem}>
                    <div className={styles.reviewRowTop}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                          {item.moduleName || item.moduleType}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                          {item.variant || 'default'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {item.status === 'accepted' && (
                          <span style={{ background: '#059669', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                            ✓ Chấp nhận
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span style={{ background: '#dc2626', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                            ✗ Loại bỏ
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span style={{ background: '#475569', color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                            Đang xem xét
                          </span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.updatedAt}</span>
                      </div>
                    </div>
                    {item.comment ? (
                      <div className={styles.reviewRowComment}>
                        💭 {item.comment}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.775rem', color: '#64748b', fontStyle: 'italic' }}>
                        Chưa có nhận xét chi tiết.
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer hành động Lưu file & Tải về */}
            <div className={styles.reviewActionsFooter}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={styles.btnSaveReviewLog}
                  onClick={handleSaveReviewsToFile}
                  disabled={isSavingReview || Object.keys(reviews).length === 0}
                >
                  {isSavingReview ? 'Đang lưu file...' : '💾 Lưu vào file ghi chép (.md)'}
                </button>
                <button
                  type="button"
                  className={styles.btnDownloadReviewLog}
                  onClick={() => {
                    const markdown = generateReviewMarkdown(Object.values(reviews));
                    downloadMarkdown(markdown, 'MODULE_DEV_REVIEW_LOG.md');
                    onShowToast?.('Đã tải file MODULE_DEV_REVIEW_LOG.md!', 'info');
                  }}
                  disabled={Object.keys(reviews).length === 0}
                >
                  <DownloadIcon size={14} /> Tải file .md
                </button>
                <button
                  type="button"
                  className={styles.btnCopyReviewLog}
                  onClick={() => {
                    const markdown = generateReviewMarkdown(Object.values(reviews));
                    navigator.clipboard.writeText(markdown);
                    onShowToast?.('Đã sao chép nội dung Markdown vào clipboard!', 'success');
                  }}
                  disabled={Object.keys(reviews).length === 0}
                >
                  <CopyIcon size={14} /> Sao chép
                </button>
              </div>

              {Object.keys(reviews).length > 0 && (
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.775rem', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    setConfirmState({
                      open: true,
                      title: 'Xóa toàn bộ nhật ký đánh giá?',
                      message: 'Thao tác này sẽ xóa trắng danh sách đánh giá đã lưu trong trình duyệt.',
                      onConfirm: () => {
                        setReviews({});
                        localStorage.removeItem('ELS_MODULE_REVIEWS');
                        setConfirmState({ open: false });
                        onShowToast?.('Đã làm trống nhật ký đánh giá.', 'info');
                      },
                    });
                  }}
                >
                  Xóa tất cả nhật ký
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false })}
        isDanger={true}
      />
    </div>
  );
}
