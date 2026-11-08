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
