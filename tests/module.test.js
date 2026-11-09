/**
 * @file module.test.js
 * Unit tests cho Module System, Dev Mode Schema & Auditor Engine
 * Theo FDD yeu-cau-chuc-nang-module-design-dev-mode.md
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MODULE_CATALOG,
  BREAKPOINT_PRESETS,
  TEST_DATASETS,
  STANDALONE_DEV_MOCK_DATA,
  PRESET_TEMPLATES,
  createPresetModuleTree,
  inferPresetAndTheme,
  createModuleInstance,
  createDefaultModuleTree,
  PERMANENT_DELETED_VARIANTS,
  PERMANENT_DELETED_MODULE_TYPES,
  getDeletedVariants,
  getDeletedModuleTypes,
  isVariantDeleted,
  getSafeVariant,
  adaptModuleTreeToEventData,
} from '../src/domain/moduleSchema.js';

import {
  auditModuleLayout,
  runResponsiveScan,
  exportAuditReport,
  AUDIT_LEVELS,
} from '../src/domain/moduleAuditor.js';

describe('Module Schema & Catalog', () => {
  it('should define catalog for 20 curated module types', () => {
    const keys = Object.keys(MODULE_CATALOG);
    assert.equal(keys.length, 20, 'Catalog must support all 20 curated module types');
    // 4 Mandatory modules
    assert.ok(keys.includes('hero'));
    assert.ok(keys.includes('countdown'));
    assert.ok(keys.includes('agenda'));
    assert.ok(keys.includes('form'));
    // Curated Content & Info modules
    assert.ok(keys.includes('speakers'));
    assert.ok(keys.includes('venue'));
    assert.ok(keys.includes('benefits'));
    assert.ok(keys.includes('offer_banner'));
    assert.ok(keys.includes('faq'));
    assert.ok(keys.includes('footer'));
    assert.ok(keys.includes('divider'));
    assert.ok(keys.includes('nav'));
    assert.ok(keys.includes('stats'));
    assert.ok(keys.includes('audience'));
    assert.ok(keys.includes('bento'));
    assert.ok(keys.includes('sponsors'));
    assert.ok(keys.includes('final_cta'));
    assert.ok(keys.includes('organizer'));
    assert.ok(keys.includes('sticky_cta'));
    assert.ok(keys.includes('announcement_bar'));
  });

  it('PRESET_TEMPLATES should define 5 presets each containing all 4 mandatory modules', () => {
    const presetKeys = Object.keys(PRESET_TEMPLATES);
    assert.deepEqual(presetKeys.sort(), ['community', 'compact', 'gala', 'techtalk', 'workshop'].sort());

    for (const key of presetKeys) {
      const preset = PRESET_TEMPLATES[key];
      assert.ok(preset.name);
      assert.ok(Array.isArray(preset.modules));
      const types = preset.modules.map((m) => m.type);
      assert.ok(types.includes('hero'), `${key} must contain hero`);
      assert.ok(types.includes('countdown'), `${key} must contain countdown`);
      assert.ok(types.includes('agenda'), `${key} must contain agenda`);
      assert.ok(types.includes('form'), `${key} must contain form`);
    }

    const workshopTree = createPresetModuleTree('workshop');
    assert.ok(workshopTree.length >= 10);
    assert.ok(workshopTree.some((m) => m.type === 'nav'));
    assert.ok(workshopTree.some((m) => m.type === 'final_cta'));
  });

  it('createDefaultModuleTree() should include 4 mandatory modules and valid tree structure', () => {
    const tree = createDefaultModuleTree();
    assert.ok(Array.isArray(tree));
    assert.ok(tree.length >= 6, 'Default tree should have at least 6 modules');

    const types = tree.map((m) => m.type);
    assert.ok(types.includes('hero'), 'Must contain hero module');
    assert.ok(types.includes('countdown'), 'Must contain countdown module');
    assert.ok(types.includes('agenda'), 'Must contain agenda module');
    assert.ok(types.includes('form'), 'Must contain form module');

    // 4 mandatory modules flag
    const mandatoryModules = tree.filter((m) => m.isMandatory);
    assert.equal(mandatoryModules.length, 4);
    assert.deepEqual(
      mandatoryModules.map((m) => m.type).sort(),
      ['agenda', 'countdown', 'form', 'hero'].sort()
    );
  });

  it('createModuleInstance() creates valid structure with default styles and variant', () => {
    const heroMod = createModuleInstance('hero');
    assert.ok(heroMod.id.startsWith('mod_hero_'));
    assert.equal(heroMod.type, 'hero');
    assert.equal(heroMod.variant, 'image-right');
    assert.equal(heroMod.dataSource, 'auto');
    assert.equal(heroMod.hidden, false);
    assert.equal(heroMod.locked, false);
    assert.equal(heroMod.styles.padding, 'normal');
    assert.equal(heroMod.styles.background, 'default');

    // Overrides
    const customFaq = createModuleInstance('faq', {
      name: 'Câu hỏi thường gặp Pro',
      variant: 'card',
      styles: { padding: 'compact', background: 'alt' },
    });
    assert.equal(customFaq.name, 'Câu hỏi thường gặp Pro');
    assert.equal(customFaq.variant, 'card');
    assert.equal(customFaq.styles.padding, 'compact');
    assert.equal(customFaq.styles.background, 'alt');
  });

  it('inferPresetAndTheme automatically detects preset, color theme and design reasoning by topic', () => {
    // 1. Tech talk
    const tech = inferPresetAndTheme({
      eventName: 'Hội thảo AI & Vibe Coding Vietnam 2026',
      description: 'Lập trình ứng dụng frontend siêu tốc với LLMs',
    });
    assert.equal(tech.presetId, 'techtalk');
    assert.equal(tech.colorTheme, 'purple');
    assert.ok(tech.reasoning.includes('Công nghệ & AI'));

    // 2. Gala VIP
    const gala = inferPresetAndTheme({
      eventName: 'Lễ kỷ niệm 10 năm & Trao giải Doanh nghiệp',
    });
    assert.equal(gala.presetId, 'gala');
    assert.equal(gala.colorTheme, 'rose');

    // 3. Community
    const comm = inferPresetAndTheme({
      eventName: 'Ngày hội Sinh viên Giao lưu CLB 2026',
    });
    assert.equal(comm.presetId, 'community');
    assert.equal(comm.colorTheme, 'amber');

    // 4. Default Workshop
    const ws = inferPresetAndTheme({
      eventName: 'Hội thảo Kỹ năng Đàm phán và Lãnh đạo',
    });
    assert.equal(ws.presetId, 'workshop');
    assert.equal(ws.colorTheme, 'blue');
  });

  it('permanently blocks deleted variants from ever appearing in modules or presets', () => {
    // 1. Kiểm tra danh sách đen vĩnh viễn và hàm hợp nhất getDeletedVariants
    const allDeleted = getDeletedVariants();
    assert.ok(allDeleted.hero.includes('image-left'));
    assert.ok(Array.isArray(PERMANENT_DELETED_VARIANTS.hero));
    assert.ok(PERMANENT_DELETED_VARIANTS.hero.includes('image-left'));
    assert.ok(PERMANENT_DELETED_VARIANTS.hero.includes('poster-fullbleed'));
    assert.ok(PERMANENT_DELETED_VARIANTS.agenda.includes('timeline-compact'));
    assert.ok(PERMANENT_DELETED_VARIANTS.speakers.includes('cast-credits'));
    assert.ok(PERMANENT_DELETED_VARIANTS.benefits.includes('cinema-trio'));

    // 2. isVariantDeleted xác định chính xác
    assert.equal(isVariantDeleted('hero', 'image-left'), true);
    assert.equal(isVariantDeleted('hero', 'poster-fullbleed'), true);
    assert.equal(isVariantDeleted('agenda', 'timeline-compact'), true);
    assert.equal(isVariantDeleted('speakers', 'cast-credits'), true);
    assert.equal(isVariantDeleted('benefits', 'cinema-trio'), true);
    assert.equal(isVariantDeleted('hero', 'image-right'), false);

    // 3. getSafeVariant tự động thay thế biến thể bị xóa bằng biến thể an toàn
    assert.equal(getSafeVariant('hero', 'image-left'), 'image-right');
    assert.equal(getSafeVariant('hero', 'poster-fullbleed'), 'image-right');
    assert.equal(getSafeVariant('agenda', 'timeline-compact'), 'timeline');
    assert.equal(getSafeVariant('speakers', 'cast-credits'), 'portrait-cards');
    assert.equal(getSafeVariant('benefits', 'cinema-trio'), 'cards');

    // 4. createModuleInstance không bao giờ tạo module với biến thể đã bị xóa
    const badHero = createModuleInstance('hero', { variant: 'image-left' });
    assert.notEqual(badHero.variant, 'image-left');
    assert.equal(badHero.variant, 'image-right');

    const badAgenda = createModuleInstance('agenda', { variant: 'timeline-compact' });
    assert.notEqual(badAgenda.variant, 'timeline-compact');
    assert.equal(badAgenda.variant, 'timeline');

    // 5. Toàn bộ 5 presets đều không chứa bất kỳ biến thể nào bị xóa và không chứa module thanh thông báo khẩn hoặc nút đăng ký dính
    assert.ok(PERMANENT_DELETED_MODULE_TYPES.includes('announcement_bar'));
    assert.ok(getDeletedModuleTypes().includes('announcement_bar'));
    assert.ok(PERMANENT_DELETED_MODULE_TYPES.includes('sticky_cta'));
    assert.ok(getDeletedModuleTypes().includes('sticky_cta'));

    for (const presetKey of Object.keys(PRESET_TEMPLATES)) {
      const tree = createPresetModuleTree(presetKey);
      assert.equal(
        tree.some((m) => m.type === 'announcement_bar'),
        false,
        `Preset ${presetKey} must not contain announcement_bar`
      );
      assert.equal(
        tree.some((m) => m.type === 'sticky_cta'),
        false,
        `Preset ${presetKey} must not contain sticky_cta`
      );
      for (const mod of tree) {
        assert.equal(
          isVariantDeleted(mod.type, mod.variant),
          false,
          `Preset ${presetKey} contains deleted variant ${mod.type}:${mod.variant}`
        );
      }
    }
  });

  it('BREAKPOINT_PRESETS covers mobile, tablet and desktop screen sizes', () => {
    assert.ok(Array.isArray(BREAKPOINT_PRESETS));
    const ids = BREAKPOINT_PRESETS.map((p) => p.id);
    assert.ok(ids.includes('mobile-s'));
    assert.ok(ids.includes('mobile-m'));
    assert.ok(ids.includes('tablet-p'));
    assert.ok(ids.includes('laptop'));
    assert.ok(ids.includes('desktop'));

    const mobileM = BREAKPOINT_PRESETS.find((p) => p.id === 'mobile-m');
    assert.equal(mobileM.width, 375);
    assert.equal(mobileM.height, 667);

    const laptop = BREAKPOINT_PRESETS.find((p) => p.id === 'laptop');
    assert.equal(laptop.width, 1280);
  });

  it('TEST_DATASETS includes real, typical, minimal, empty, long_text, special_chars', () => {
    const expected = ['real', 'typical', 'minimal', 'empty', 'long_text', 'special_chars'];
    for (const key of expected) {
      assert.ok(TEST_DATASETS[key], `Missing dataset ${key}`);
      assert.ok(TEST_DATASETS[key].label);
    }
    // Verify extreme conditions in datasets
    assert.ok(TEST_DATASETS.long_text.event.eventName.length > 50);
    assert.equal(TEST_DATASETS.empty.event.eventName, '');
    assert.ok(TEST_DATASETS.special_chars.event.eventName.includes('<Tech Trends>'));
  });

  it('STANDALONE_DEV_MOCK_DATA provides rich sample assets, titles, descriptions, speakers, and agenda', () => {
    assert.ok(STANDALONE_DEV_MOCK_DATA.event);
    assert.ok(STANDALONE_DEV_MOCK_DATA.event.eventName);
    assert.ok(STANDALONE_DEV_MOCK_DATA.event.venue);
    assert.ok(STANDALONE_DEV_MOCK_DATA.event.speakers.length >= 3);
    assert.ok(STANDALONE_DEV_MOCK_DATA.event.agenda.length >= 4);

    assert.ok(STANDALONE_DEV_MOCK_DATA.ai);
    assert.ok(STANDALONE_DEV_MOCK_DATA.ai.headline);
    assert.ok(STANDALONE_DEV_MOCK_DATA.ai.description);
    assert.equal(STANDALONE_DEV_MOCK_DATA.ai.benefits.length, 3);

    assert.ok(STANDALONE_DEV_MOCK_DATA.assets.length >= 6);
    const heroAsset = STANDALONE_DEV_MOCK_DATA.assets.find((a) => a.role === 'hero');
    assert.ok(heroAsset && (heroAsset.dataUrl.startsWith('/sample-assets/') || heroAsset.dataUrl.startsWith('data:image/svg+xml')));
    const venueAsset = STANDALONE_DEV_MOCK_DATA.assets.find((a) => a.role === 'venue');
    assert.ok(venueAsset && (venueAsset.dataUrl.startsWith('/sample-assets/') || venueAsset.dataUrl.startsWith('data:image/svg+xml')));
    const speakerAssets = STANDALONE_DEV_MOCK_DATA.assets.filter((a) => a.role === 'speaker');
    assert.ok(speakerAssets.length >= 3);
    assert.ok(speakerAssets[0].dataUrl.includes('speaker_1.jpg'));
  });
});

describe('Module Auditor Engine', () => {
  it('detects missing mandatory modules as ERROR', () => {
    // Tree without hero and form
    const incompleteTree = [
      createModuleInstance('countdown'),
      createModuleInstance('agenda'),
    ];
    const issues = auditModuleLayout(incompleteTree, { eventName: 'Test Event' }, [], 375);
    const errors = issues.filter((i) => i.level === AUDIT_LEVELS.ERROR);

    assert.ok(errors.some((e) => e.id === 'missing_hero' && e.title.includes('HERO')));
    assert.ok(errors.some((e) => e.id === 'missing_form' && e.title.includes('FORM')));
  });

  it('detects hidden mandatory modules as WARNING', () => {
    const tree = createDefaultModuleTree();
    const heroMod = tree.find((m) => m.type === 'hero');
    heroMod.hidden = true;

    const issues = auditModuleLayout(tree, { eventName: 'Test Event' }, [], 375);
    const warnings = issues.filter((i) => i.level === AUDIT_LEVELS.WARNING);

    assert.ok(warnings.some((w) => w.id === 'hidden_hero'));
  });

  it('detects empty event title and empty speakers suggestions', () => {
    const tree = createDefaultModuleTree();
    // Empty event title and empty speakers
    const issues = auditModuleLayout(tree, { eventName: '', speakers: [] }, [], 375);

    // Should flag missing headline/title on hero
    assert.ok(issues.some((i) => i.id.startsWith('empty_hero_')));

    // Should flag empty speakers list
    assert.ok(issues.some((i) => i.id.startsWith('empty_speakers_')));
  });

  it('runResponsiveScan() audits layout across 5 screen widths', () => {
    const tree = createDefaultModuleTree();
    const scan = runResponsiveScan(tree, { eventName: 'AI Conference 2026' }, []);

    assert.ok(Array.isArray(scan.resultsByBreakpoint));
    assert.equal(scan.resultsByBreakpoint.length, 5);
    assert.deepEqual(
      scan.resultsByBreakpoint.map((b) => b.width),
      [320, 375, 768, 1024, 1280]
    );

    assert.ok(typeof scan.summary.totalErrors === 'number');
    assert.ok(typeof scan.summary.totalWarnings === 'number');
    assert.ok(typeof scan.summary.totalSuggestions === 'number');
    assert.ok(scan.overallStatus);
  });

  it('exportAuditReport() produces formatted Markdown report', () => {
    const tree = createDefaultModuleTree();
    const scan = runResponsiveScan(tree, { eventName: 'Sự kiện Ra mắt Sản phẩm' }, []);
    const md = exportAuditReport(scan, 'Dự án Ra Mắt');

    assert.ok(typeof md === 'string');
    assert.ok(md.includes('# BÁO CÁO KIỂM TRA ĐA KÍCH THƯỚC (RESPONSIVE AUDIT REPORT)'));
    assert.ok(md.includes('Dự án: Dự án Ra Mắt'));
    assert.ok(md.includes('CHI TIẾT THEO TỪNG KÍCH THƯỚC'));
    assert.ok(md.includes('320px'));
    assert.ok(md.includes('1280px'));
  });

  it('detects v3 layout suggestions: long page without nav and missing final CTA', () => {
    // 8 modules without nav and without CTA after module 5
    const longTree = [
      createModuleInstance('hero'),
      createModuleInstance('countdown'),
      createModuleInstance('form'),
      createModuleInstance('agenda'),
      createModuleInstance('speakers'),
      createModuleInstance('venue'),
      createModuleInstance('benefits'),
      createModuleInstance('faq'),
    ];

    const issues = auditModuleLayout(longTree, { eventName: 'Hội thảo AI' }, [], 1280);
    assert.ok(issues.some((i) => i.id === 'long_page_no_nav'), 'Should suggest nav on pages with 7+ modules');
    assert.ok(issues.some((i) => i.id === 'final_cta_missing'), 'Should suggest final CTA when no CTA appears after 5th module');
  });
});

describe('Trường hợp sử dụng cụ thể của từng module (Nhiều / Ít / Không có thông tin, ảnh) & Kiểm tra không vi phạm', () => {
  it('Tất cả 18 module đang hoạt động trong catalog đều có định nghĩa useCases cụ thể (rich, sparse, empty)', () => {
    const activeModuleTypes = [
      'hero', 'countdown', 'agenda', 'form', 'speakers', 'venue', 'benefits',
      'offer_banner', 'faq', 'footer', 'divider', 'nav', 'stats', 'audience',
      'bento', 'sponsors', 'final_cta', 'organizer'
    ];

    for (const type of activeModuleTypes) {
      const cat = MODULE_CATALOG[type];
      assert.ok(cat, `Module ${type} phải tồn tại trong catalog`);
      assert.ok(cat.useCases, `Module ${type} phải có trường useCases`);
      assert.ok(cat.useCases.rich, `Module ${type} phải có định nghĩa case rich`);
      assert.ok(cat.useCases.sparse, `Module ${type} phải có định nghĩa case sparse`);
      assert.ok(cat.useCases.empty, `Module ${type} phải có định nghĩa case empty`);
      assert.ok(cat.useCases.rich.condition && cat.useCases.rich.behavior);
      assert.ok(cat.useCases.sparse.condition && cat.useCases.sparse.behavior);
      assert.ok(cat.useCases.empty.condition && cat.useCases.empty.behavior);
    }
  });

  it('Trường hợp 1: Nhiều thông tin & Đầy đủ ảnh (Rich Data & Images) -> Vận dụng tối đa module, không vi phạm', () => {
    const richEvent = {
      eventName: 'Hội thảo Trí tuệ Nhân tạo & Đột phá 2026',
      eventDate: '2026-11-20',
      eventTime: '08:30',
      venue: 'Trung tâm Đổi mới Sáng tạo NIC, Hòa Lạc, Hà Nội',
      description: 'Chương trình hội thảo chuyên sâu khám phá các bước tiến mới nhất trong kỷ nguyên AI. Người tham dự sẽ được giao lưu trực tiếp với các chuyên gia đầu ngành, tham gia phiên thảo luận bàn tròn và nhận bộ tài liệu độc quyền.',
      earlyBirdOffer: 'Tặng trọn bộ Ebook & Giảm 20% học phí',
      speakers: [
        { id: 'spk_1', name: 'TS. Nguyễn Văn A', title: 'Chuyên gia Trưởng AI' },
        { id: 'spk_2', name: 'ThS. Trần Thị B', title: 'Kỹ sư Cấp cao' },
        { id: 'spk_3', name: 'Lê Hoàng C', title: 'Giám đốc Công nghệ' },
      ],
      agenda: [
        { id: 'ag_1', time: '08:30', title: 'Đón tiếp đại biểu & Check-in QR' },
        { id: 'ag_2', time: '09:00', title: 'Khai mạc & Keynote AI' },
        { id: 'ag_3', time: '10:15', title: 'Tọa đàm chuyên gia' },
        { id: 'ag_4', time: '11:30', title: 'Hỏi đáp & Bế mạc' },
      ],
    };

    const richAssets = [
      { id: 'ast_hero', role: 'hero', dataUrl: 'data:image/svg+xml;utf8,<svg></svg>', caption: 'Poster sự kiện AI' },
      { id: 'ast_venue', role: 'venue', dataUrl: 'data:image/svg+xml;utf8,<svg></svg>', caption: 'Hội trường NIC' },
      { id: 'ast_gift', role: 'gift', dataUrl: 'data:image/svg+xml;utf8,<svg></svg>', caption: 'Quà tặng Ebook' },
      { id: 'ast_spk1', role: 'speaker', dataUrl: 'data:image/svg+xml;utf8,<svg></svg>', caption: 'TS. Nguyễn Văn A' },
      { id: 'ast_spk2', role: 'speaker', dataUrl: 'data:image/svg+xml;utf8,<svg></svg>', caption: 'ThS. Trần Thị B' },
      { id: 'ast_spk3', role: 'speaker', dataUrl: 'data:image/svg+xml;utf8,<svg></svg>', caption: 'Lê Hoàng C' },
    ];

    const baseTree = createPresetModuleTree('workshop');
    const adaptedTree = adaptModuleTreeToEventData(baseTree, richEvent, richAssets, {
      earlyBirdOffer: richEvent.earlyBirdOffer,
      bentoHighlights: [
        { tag: '01 / TRỌNG TÂM', title: 'Kiến trúc AI', desc: 'Chuyên sâu' },
        { tag: '02 / ƯU ĐÃI', title: 'Giảm 20%', desc: 'Đăng ký sớm' },
        { tag: '03 / CHUYÊN GIA', title: 'Giao lưu', desc: 'Hỏi đáp trực tiếp' },
        { tag: '04 / ĐỊA ĐIỂM', title: 'Hội trường NIC', desc: 'Hòa Lạc' },
      ],
      audience: [
        { badge: 'Nhóm 1', title: 'Lập trình viên', desc: 'Học hỏi thực chiến' },
        { badge: 'Nhóm 2', title: 'Lãnh đạo công nghệ', desc: 'Định hướng chiến lược' },
        { badge: 'Nhóm 3', title: 'Sinh viên IT', desc: 'Mở rộng cơ hội' },
      ],
      organizer: {
        name: 'Ban Tổ Chức Hội Thảo AI 2026',
        email: 'contact@ai-summit.vn',
        hotline: '024 3999 8888',
      },
    }, { expandWhenRich: true });

    // Kiểm tra các module phong phú được giữ và tận dụng
    const types = adaptedTree.map((m) => m.type);
    assert.ok(types.includes('hero'));
    assert.ok(types.includes('countdown'));
    assert.ok(types.includes('agenda'));
    assert.ok(types.includes('form'));
    assert.ok(types.includes('speakers'));
    assert.ok(types.includes('venue'));
    assert.ok(types.includes('bento'));
    assert.ok(types.includes('audience'));
    assert.ok(types.includes('organizer'));
    assert.ok(types.includes('offer_banner'));

    // Hero và Venue dùng biến thể có ảnh vì có assets tương ứng
    const heroMod = adaptedTree.find((m) => m.type === 'hero');
    assert.equal(heroMod.variant, 'image-right');
    const venueMod = adaptedTree.find((m) => m.type === 'venue');
    assert.equal(venueMod.variant, 'image-left');

    // Quét kiểm tra Auditor: Đạt chuẩn 0 lỗi và 0 cảnh báo
    const issues = auditModuleLayout(adaptedTree, richEvent, richAssets, 1280);
    const errors = issues.filter((i) => i.level === AUDIT_LEVELS.ERROR);
    const warnings = issues.filter((i) => i.level === AUDIT_LEVELS.WARNING);
    assert.equal(errors.length, 0, `Không được có lỗi: ${JSON.stringify(errors)}`);
    assert.equal(warnings.length, 0, `Không được có cảnh báo: ${JSON.stringify(warnings)}`);
  });

  it('Trường hợp 2: Ít thông tin (1 Diễn giả, không có ảnh Venue) -> Tự động chuyển solo-spotlight và map-left', () => {
    const sparseEvent = {
      eventName: 'Workshop Khởi nghiệp Tinh gọn',
      eventDate: '2026-12-05',
      eventTime: '09:00',
      venue: 'Tòa nhà Innovation, Quận 1, TP. Hồ Chí Minh',
      description: 'Chia sẻ kinh nghiệm xây dựng MVP từ founder có kinh nghiệm.',
      earlyBirdOffer: 'Ưu đãi vé tham dự sớm',
      speakers: [
        { id: 'spk_solo', name: 'Nguyễn Hoàng Minh', title: 'Serial Entrepreneur' },
      ],
      agenda: [
        { id: 'ag_1', time: '09:00', title: 'Khai mạc & Giới thiệu' },
        { id: 'ag_2', time: '10:00', title: 'Chia sẻ kinh nghiệm thực chiến' },
      ],
    };

    // Chỉ có 1 ảnh hero, không có ảnh venue
    const sparseAssets = [
      { id: 'ast_hero', role: 'hero', dataUrl: 'data:image/svg+xml;utf8,<svg></svg>', caption: 'Banner workshop' },
    ];

    const baseTree = createPresetModuleTree('workshop');
    const adaptedTree = adaptModuleTreeToEventData(baseTree, sparseEvent, sparseAssets, {
      earlyBirdOffer: sparseEvent.earlyBirdOffer,
    }, { expandWhenRich: false });

    // Khi chỉ có 1 diễn giả, module speakers tự động chuyển sang solo-spotlight để không bị kéo giãn to
    const spkMod = adaptedTree.find((m) => m.type === 'speakers');
    assert.equal(spkMod.variant, 'solo-spotlight');

    // Khi không có ảnh venue, module venue tự động chuyển sang map-left hiển thị bản đồ
    const venueMod = adaptedTree.find((m) => m.type === 'venue');
    assert.equal(venueMod.variant, 'map-left');

    const issues = auditModuleLayout(adaptedTree, sparseEvent, sparseAssets, 1280);
    const errors = issues.filter((i) => i.level === AUDIT_LEVELS.ERROR);
    const warnings = issues.filter((i) => i.level === AUDIT_LEVELS.WARNING);
    assert.equal(errors.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Trường hợp 3: Không có thông tin bổ sung & 0 ảnh (Zero Extra Description & 0 Images) -> Không bịa đặt, cắt giảm module phù hợp', () => {
    const minimalEvent = {
      eventName: 'Hội nghị Chiến lược Kinh doanh 2026',
      eventDate: '2026-11-28',
      eventTime: '08:30',
      venue: 'Khách sạn Melia, Hà Nội',
      description: '', // Bỏ trống ô mô tả thêm
      earlyBirdOffer: '', // Không có ưu đãi sớm
      speakers: [
        { id: 'spk_1', name: 'Đặng Quốc Hưng', title: 'Cố vấn Chiến lược' },
        { id: 'spk_2', name: 'Phạm Thu Trang', title: 'Giám đốc Vận hành' },
      ],
      agenda: [
        { id: 'ag_1', time: '08:30', title: 'Đón tiếp đại biểu' },
        { id: 'ag_2', time: '09:00', title: 'Phiên thảo luận định hướng' },
      ],
    };

    const emptyAssets = []; // 0 ảnh được tải lên

    const baseTree = createPresetModuleTree('workshop');
    const adaptedTree = adaptModuleTreeToEventData(baseTree, minimalEvent, emptyAssets, {}, { expandWhenRich: false });

    const types = adaptedTree.map((m) => m.type);

    // Không được vi phạm nguyên tắc: Không bịa đặt -> Cắt giảm các module mở rộng đòi hỏi mô tả thêm
    assert.equal(types.includes('bento'), false, 'Không có mô tả thêm -> phải cắt giảm bento');
    assert.equal(types.includes('audience'), false, 'Không có mô tả thêm -> phải cắt giảm audience');
    assert.equal(types.includes('organizer'), false, 'Không có mô tả thêm -> phải cắt giảm organizer');
    assert.equal(types.includes('sponsors'), false, 'Không có nhà tài trợ -> phải cắt giảm sponsors');
    assert.equal(types.includes('offer_banner'), false, 'Không có ưu đãi sớm -> phải cắt giảm offer_banner');

    // 4 Module bắt buộc vẫn được bảo toàn nguyên vẹn
    assert.ok(types.includes('hero'));
    assert.ok(types.includes('countdown'));
    assert.ok(types.includes('agenda'));
    assert.ok(types.includes('form'));

    // Module Hero tự động chuyển sang split-card (thẻ kính mờ không ảnh) vì 0 ảnh
    const heroMod = adaptedTree.find((m) => m.type === 'hero');
    assert.equal(heroMod.variant, 'split-card', 'Hero không có ảnh phải chuyển sang split-card');

    // Module Venue tự động chuyển sang map-left (bản đồ SVG) vì 0 ảnh
    const venueMod = adaptedTree.find((m) => m.type === 'venue');
    assert.equal(venueMod.variant, 'map-left', 'Venue không có ảnh phải chuyển sang map-left');

    // Kiểm tra Auditor đảm bảo layout sau khi thích ứng không có lỗi hoặc cảnh báo vi phạm
    const issues = auditModuleLayout(adaptedTree, minimalEvent, emptyAssets, 1280);
    const errors = issues.filter((i) => i.level === AUDIT_LEVELS.ERROR);
    const warnings = issues.filter((i) => i.level === AUDIT_LEVELS.WARNING);
    assert.equal(errors.length, 0);
    assert.equal(warnings.length, 0);
  });

  it('Auditor phát hiện và cảnh báo vi phạm nếu bố cục chưa được thích ứng phù hợp với dữ liệu', () => {
    // Cố tình tạo một cây module vi phạm quy tắc dữ liệu:
    // - Hero dùng image-right nhưng 0 có ảnh
    // - Bento và Audience xuất hiện nhưng mô tả thêm rỗng
    // - Sponsors xuất hiện nhưng không có nhà tài trợ
    const violatingTree = [
      createModuleInstance('hero', { variant: 'image-right' }),
      createModuleInstance('countdown'),
      createModuleInstance('bento'),
      createModuleInstance('audience'),
      createModuleInstance('sponsors'),
      createModuleInstance('agenda'),
      createModuleInstance('form'),
    ];

    const emptyDescEvent = {
      eventName: 'Sự kiện Chưa Hoàn Thiện',
      description: '',
      sponsors: [],
    };
    const emptyAssets = [];

    const issues = auditModuleLayout(violatingTree, emptyDescEvent, emptyAssets, 1280);
    const warnings = issues.filter((i) => i.level === AUDIT_LEVELS.WARNING);

    // Auditor phải phát hiện các vi phạm về dữ liệu và ảnh
    assert.ok(warnings.some((w) => w.id.startsWith('hero_no_image_')), 'Phải cảnh báo Hero image-right khi không có ảnh');
    assert.ok(warnings.some((w) => w.id.startsWith('bento_missing_description_')), 'Phải cảnh báo Bento khi không có mô tả thêm');
    assert.ok(warnings.some((w) => w.id.startsWith('audience_missing_description_')), 'Phải cảnh báo Audience khi không có mô tả thêm');
    assert.ok(warnings.some((w) => w.id.startsWith('sponsors_empty_')), 'Phải cảnh báo Sponsors khi không có đối tác');
  });

  it('Khắc phục bẫy một chiều (FIX-05) & Không dùng đôi ảnh (FIX-02): Khôi phục hai chiều và tôn trọng dismissed', () => {
    // 1. Khôi phục Hero khi thêm ảnh
    const treeWithSplitHero = [
      createModuleInstance('hero', { variant: 'split-card' }),
      createModuleInstance('countdown'),
      createModuleInstance('agenda'),
      createModuleInstance('form'),
    ];
    const heroAsset = { id: 'ast_hero_1', role: 'hero', dataUrl: 'data:image/png;base64,123' };
    const recoveredTree = adaptModuleTreeToEventData(treeWithSplitHero, { eventName: 'Khôi phục ảnh' }, [heroAsset]);
    assert.equal(recoveredTree.find((m) => m.type === 'hero').variant, 'image-right', 'Hero split-card phải tự khôi phục về image-right khi có ảnh');

    // 2. Khôi phục Offer Banner khi xóa ảnh quà
    const treeWithCardOffer = [
      createModuleInstance('offer_banner', { variant: 'card-image-left' }),
      createModuleInstance('hero', { variant: 'split-card' }),
      createModuleInstance('countdown'),
      createModuleInstance('agenda'),
      createModuleInstance('form'),
    ];
    const treeWithoutGift = adaptModuleTreeToEventData(treeWithCardOffer, { eventName: 'Xóa quà', earlyBirdOffer: 'Giảm 20%' }, []);
    assert.equal(treeWithoutGift.find((m) => m.type === 'offer_banner').variant, 'ribbon', 'Offer card-image-left phải khôi phục về ribbon khi mất ảnh quà');

    // 3. Khôi phục Speakers khi số diễn giả tăng từ 1 lên nhiều
    const treeWithSoloSpeaker = [
      createModuleInstance('speakers', { variant: 'solo-spotlight' }),
      createModuleInstance('hero', { variant: 'split-card' }),
      createModuleInstance('countdown'),
      createModuleInstance('agenda'),
      createModuleInstance('form'),
    ];
    const multiSpeakers = [
      { id: '1', name: 'Diễn giả 1' },
      { id: '2', name: 'Diễn giả 2' },
    ];
    const treeMultiSpeakers = adaptModuleTreeToEventData(treeWithSoloSpeaker, { eventName: 'Nhiều diễn giả', speakers: multiSpeakers });
    assert.equal(treeMultiSpeakers.find((m) => m.type === 'speakers').variant, 'portrait-cards', 'Speakers solo-spotlight phải khôi phục về portrait-cards khi có nhiều hơn 1 diễn giả');

    // 4. Tôn trọng dismissedModules: không hồi sinh module bị người dùng xóa
    const treeWithExtraDesc = createDefaultModuleTree();
    const treeWithDismissed = adaptModuleTreeToEventData(
      treeWithExtraDesc,
      { eventName: 'Sự kiện có mô tả', description: 'Mô tả rất chi tiết cho sự kiện' },
      [],
      {},
      { expandWhenRich: true, dismissed: ['bento', 'audience'] }
    );
    assert.equal(treeWithDismissed.some((m) => m.type === 'bento'), false, 'Bento bị dismissed không được tự ý xuất hiện lại');
    assert.equal(treeWithDismissed.some((m) => m.type === 'audience'), false, 'Audience bị dismissed không được tự ý xuất hiện lại');

    // 5. FIX-02: Một ảnh role "other" đã dùng cho Hero không được dùng đôi cho Gift
    const singleOtherAsset = [{ id: 'ast_other_1', role: 'other', dataUrl: 'data:image/png;base64,other' }];
    const treeWithOffer = [
      createModuleInstance('hero', { variant: 'image-right' }),
      createModuleInstance('offer_banner', { variant: 'ribbon' }),
      createModuleInstance('countdown'),
      createModuleInstance('agenda'),
      createModuleInstance('form'),
    ];
    const adaptedTreeWithOther = adaptModuleTreeToEventData(
      treeWithOffer,
      { eventName: 'Test ảnh', earlyBirdOffer: 'Tặng voucher' },
      singleOtherAsset
    );
    const offerMod = adaptedTreeWithOther.find((m) => m.type === 'offer_banner');
    assert.equal(offerMod.variant, 'ribbon', 'Ảnh duy nhất đã gán cho Hero không được gán đôi làm ảnh quà tặng của Offer');
    assert.equal(offerMod.customContent?.giftImageId, undefined);
  });
});
