#!/usr/bin/env python3
"""
TradeNexus AI Sales Agent — Chinese Pitch Deck Generator
Creates a professional Chinese-language presentation for pitching to Chinese suppliers, manufacturers, and businesses.
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ── Color Palette (matching TradeNexus brand) ──
DARK_BG = RGBColor(0x0F, 0x17, 0x2A)       # slate-900
DARKER_BG = RGBColor(0x02, 0x06, 0x17)      # slate-950
BLUE_PRIMARY = RGBColor(0x3B, 0x82, 0xF6)   # blue-500
BLUE_DARK = RGBColor(0x1D, 0x4E, 0xD8)      # blue-700
CYAN = RGBColor(0x06, 0xB6, 0xD4)           # cyan-500
EMERALD = RGBColor(0x10, 0xB9, 0x81)        # emerald-500
ORANGE = RGBColor(0xF9, 0x73, 0x16)         # orange-500
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GRAY = RGBColor(0x94, 0xA3, 0xB8)     # slate-400
MEDIUM_GRAY = RGBColor(0x64, 0x74, 0x8B)    # slate-500
DARK_GRAY = RGBColor(0x33, 0x41, 0x55)      # slate-700
BORDER_GRAY = RGBColor(0x1E, 0x29, 0x3B)    # slate-800
INDIGO = RGBColor(0x63, 0x66, 0xF1)         # indigo-500
RED_ACCENT = RGBColor(0xEF, 0x44, 0x44)     # red-500

prs = Presentation()
prs.slide_width = Inches(13.333)   # 16:9 widescreen
prs.slide_height = Inches(7.5)

# ── Helper Functions ──

def add_dark_background(slide, color=DARK_BG):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_gradient_bar(slide, left, top, width, height, color1=BLUE_PRIMARY, color2=CYAN):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color1
    shape.line.fill.background()
    return shape

def add_rect(slide, left, top, width, height, fill_color=None, border_color=None, corner_radius=None):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if corner_radius else MSO_SHAPE.RECTANGLE,
        left, top, width, height
    )
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    return shape

def add_text_box(slide, left, top, width, height, text, font_size=Pt(18),
                 color=WHITE, bold=False, alignment=PP_ALIGN.LEFT, font_name='Microsoft YaHei',
                 line_spacing=1.2):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = font_size
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    p.space_after = Pt(line_spacing * 4)
    return txBox

def add_multiline_text(slide, left, top, width, height, lines, font_name='Microsoft YaHei'):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, line_data in enumerate(lines):
        text, font_size, color, bold = line_data[:4]
        alignment = line_data[4] if len(line_data) > 4 else PP_ALIGN.LEFT
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = text
        p.font.size = font_size
        p.font.color.rgb = color
        p.font.bold = bold
        p.font.name = font_name
        p.alignment = alignment
        p.space_after = Pt(4)
    return txBox

def add_stat_card(slide, left, top, width, height, number, label, num_color=CYAN):
    card = add_rect(slide, left, top, width, height,
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=RGBColor(0x1E, 0x29, 0x3B),
                    corner_radius=Inches(0.15))
    add_text_box(slide, left + Inches(0.3), top + Inches(0.2), width - Inches(0.6), Inches(0.6),
                 number, Pt(36), num_color, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
    add_text_box(slide, left + Inches(0.3), top + Inches(0.7), width - Inches(0.6), Inches(0.4),
                 label, Pt(10), MEDIUM_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')
    return card

def add_section_header(slide, section_num, title_text):
    add_gradient_bar(slide, Inches(0), Inches(0), Inches(13.333), Inches(0.06), BLUE_PRIMARY)
    add_text_box(slide, Inches(1), Inches(0.4), Inches(11), Inches(0.5),
                 f"{section_num}  ▸  {title_text}", Pt(11), CYAN, True, PP_ALIGN.LEFT, 'Microsoft YaHei')

def add_title_and_subtitle(slide, title, subtitle=None, title_size=Pt(36)):
    add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(1.0),
                 title, title_size, WHITE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
    if subtitle:
        add_text_box(slide, Inches(1), Inches(2.2), Inches(11.3), Inches(0.8),
                     subtitle, Pt(16), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 1: 封面 — TITLE SLIDE
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
add_dark_background(slide, DARKER_BG)

add_gradient_bar(slide, Inches(0), Inches(0), Inches(13.333), Inches(0.08), BLUE_PRIMARY, CYAN)

# Glow circle
glow = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9.5), Inches(1.5), Inches(5), Inches(5))
glow.fill.solid()
glow.fill.fore_color.rgb = BLUE_PRIMARY
glow.fill.fore_color.brightness = 0.95
glow.line.fill.background()

# Logo
add_text_box(slide, Inches(1), Inches(1.0), Inches(6), Inches(0.6),
             "⬡  TradeNexus", Pt(16), CYAN, True, PP_ALIGN.LEFT, 'Outfit')

# Main title
add_multiline_text(slide, Inches(1), Inches(2.5), Inches(7.5), Inches(2.0), [
    ("全球采购需求", Pt(48), WHITE, True, PP_ALIGN.LEFT),
    ("秒级匹配您的供应", Pt(48), CYAN, True, PP_ALIGN.LEFT),
])

# Subtitle
add_text_box(slide, Inches(1), Inches(4.2), Inches(7), Inches(1.0),
             "自主 AI 销售代理——24 小时不间断\n"
             "帮您在全球 190+ 国家发现、核验并锁定优质 B2B 买家",
             Pt(16), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')

# Bottom stats
add_stat_card(slide, Inches(1), Inches(5.5), Inches(2.0), Inches(1.0), "190+", "覆盖国家", CYAN)
add_stat_card(slide, Inches(3.3), Inches(5.5), Inches(2.0), Inches(1.0), "4,500+", "活跃买家已探测", EMERALD)
add_stat_card(slide, Inches(5.6), Inches(5.5), Inches(2.0), Inches(1.0), "98%", "匹配精准度", BLUE_PRIMARY)

add_gradient_bar(slide, Inches(0), Inches(7.42), Inches(13.333), Inches(0.08), BLUE_PRIMARY, CYAN)

add_text_box(slide, Inches(8.5), Inches(6.8), Inches(4), Inches(0.5),
             "AI 赋能 B2B 外贸拓客平台", Pt(10), MEDIUM_GRAY, False, PP_ALIGN.RIGHT, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 2: 行业痛点 — THE PROBLEM
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "01", "行业挑战")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11), Inches(0.8),
             "外贸获客——对于制造商来说，问题出在哪？", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11), Inches(0.6),
             "供应商在展会、冷邮件和未经验证的客户名单上浪费了大量资金——却始终未能建立起真正的销售管道。",
             Pt(14), LIGHT_GRAY, False)

problems = [
    ("🔍", "手动调研效率低", "团队花费数周时间在谷歌上搜索买家、\n抓取目录信息，却不知道应该联系谁。"),
    ("💸", "展会成本高昂", "单次展会 15万–80万人民币。\n3天时间，数百张名片，几乎零跟进转化。"),
    ("📉", "客户名单未核验", "购买的 B2B 名单退信率高达 30–50%。\n联系方式过时、行业不匹配、毫无上下文。"),
    ("🌍", "语言与文化壁垒", "触达 190 个国家的买家需要\n本地市场知识，供应商难以具备。"),
    ("⏳", "缺乏系统化跟进", "即使找到了潜在客户，也没有系统化的\n方式来培育、追踪和跨时区成交。"),
    ("🚫", "错失商机", "买家现在就在搜索您的产品。\n只是您不知道他们是谁、在哪里。"),
]

for i, (icon, title, desc) in enumerate(problems):
    col = i % 3
    row = i // 3
    x = Inches(1 + col * 3.9)
    y = Inches(3.0 + row * 2.1)

    card = add_rect(slide, x, y, Inches(3.6), Inches(1.85),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=BORDER_GRAY, corner_radius=Inches(0.12))
    add_text_box(slide, x + Inches(0.25), y + Inches(0.15), Inches(3.1), Inches(0.35),
                 f"{icon}  {title}", Pt(13), WHITE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
    add_text_box(slide, x + Inches(0.25), y + Inches(0.6), Inches(3.1), Inches(1.1),
                 desc, Pt(10), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 3: 解决方案 — THE SOLUTION
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "02", "解决方案")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11), Inches(0.8),
             "TradeNexus AI：您的自主全球销售团队", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.8),
             "只需描述一次您的产品，AI 代理将自动发现已核验的买家、分析市场、\n"
             "筛选公司资质并撰写个性化开发信——全天候自动化运行。",
             Pt(14), LIGHT_GRAY, False)

features = [
    ("🧠", "AI 产品\n理解引擎", "上传产品规格书或输入描述。\nAI 自动提取技术参数、认证\n信息和理想买家画像。", BLUE_PRIMARY),
    ("🌐", "全球买家\n发现引擎", "自主代理搜索 190+ 国家，\n覆盖 Google、LinkedIn、\nFacebook、Instagram 及各国商会。", CYAN),
    ("✅", "实时核验\n系统", "每条线索均经过交叉核验：\nGoogle Maps 实地验证、社交媒体\n匹配、邮箱和电话有效性检查。", EMERALD),
    ("📊", "市场情报\n报告", "为每个目标市场生成完整报告：\nHS 编码、进口关税、竞争对手份额、\n增长趋势、定价结构和准入策略。", ORANGE),
    ("🤖", "24/7\n无人值守模式", "开启自动巡航后无需人工干预。\nAI 每隔几分钟重新扫描市场，\n持续学习优化渠道表现。", INDIGO),
    ("✉️", "AI 外联\n开发信", "针对每条线索、每个市场、每种\n买家类型，生成个性化的冷邮件、\nLinkedIn 消息和 WhatsApp 话术。", BLUE_PRIMARY),
]

for i, (icon, title, desc, accent) in enumerate(features):
    col = i % 3
    row = i // 3
    x = Inches(1 + col * 3.9)
    y = Inches(3.0 + row * 2.1)

    card = add_rect(slide, x, y, Inches(3.6), Inches(1.85),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=BORDER_GRAY, corner_radius=Inches(0.12))
    add_gradient_bar(slide, x, y, Inches(3.6), Inches(0.05), accent, accent)

    add_text_box(slide, x + Inches(0.25), y + Inches(0.2), Inches(3.1), Inches(0.55),
                 f"{icon}  {title}", Pt(13), WHITE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
    add_text_box(slide, x + Inches(0.25), y + Inches(0.8), Inches(3.1), Inches(1.0),
                 desc, Pt(9.5), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 4: 操作流程 — HOW IT WORKS
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "03", "操作流程")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "从产品到销售管道，只需三步", Pt(34), WHITE, True)
add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "无需手动调研。无需昂贵数据库。无需销售团队。",
             Pt(14), LIGHT_GRAY, False)

steps = [
    ("1", "描述您的\n产品",
     "上传 PDF 规格书、粘贴产品描述\n或仅输入产品名称。AI 自动提取\n技术参数、认证资质、理想买家\n画像和价值主张。",
     BLUE_PRIMARY),
    ("2", "AI 侦察\n全球市场",
     "自主代理通过应用场景驱动发现，\n搜索 190+ 国家。在 Google、\nLinkedIn、Facebook、Instagram\n及行业目录中交叉寻找买家。",
     CYAN),
    ("3", "联系\n并成交",
     "获取已验证的邮箱、电话、社交媒体\n资料和 AI 生成的开发信。全程追踪\n每条线索，从发现到成交，\n一目了然。",
     EMERALD),
]

for i, (num, title, desc, accent) in enumerate(steps):
    x = Inches(1 + i * 4.0)
    y = Inches(3.0)

    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(1.2), y, Inches(1.2), Inches(1.2))
    circle.fill.solid()
    circle.fill.fore_color.rgb = accent
    circle.line.fill.background()
    tf = circle.text_frame
    p = tf.paragraphs[0]
    p.text = num
    p.font.size = Pt(36)
    p.font.color.rgb = WHITE
    p.font.bold = True
    p.font.name = 'Microsoft YaHei'
    p.alignment = PP_ALIGN.CENTER

    if i < 2:
        arrow = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                       x + Inches(2.6), y + Inches(0.4),
                                       Inches(1.0), Inches(0.4))
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = DARK_GRAY
        arrow.line.fill.background()

    add_text_box(slide, x + Inches(0.3), y + Inches(1.5), Inches(3.2), Inches(0.65),
                 title, Pt(18), WHITE, True, PP_ALIGN.CENTER, 'Microsoft YaHei')
    add_text_box(slide, x + Inches(0.3), y + Inches(2.3), Inches(3.2), Inches(2.0),
                 desc, Pt(11), LIGHT_GRAY, False, PP_ALIGN.CENTER, 'Microsoft YaHei')

add_text_box(slide, Inches(1), Inches(6.5), Inches(11.3), Inches(0.4),
             "⚡  从产品描述到第一批已验证线索：平均不到 3 分钟。",
             Pt(11), EMERALD, True, PP_ALIGN.CENTER, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 5: 全球覆盖 — GLOBAL COVERAGE
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "04", "全球版图")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "190+ 国家的实时 B2B 采购需求", Pt(34), WHITE, True)
add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "我们的 AI 代理 24/7 监控全球 B2B 采购信号。以下是平台实时探测到的热点市场：",
             Pt(14), LIGHT_GRAY, False)

hotspots = [
    ("🇦🇪", "阿联酋·迪拜", "320+ 买家", "个人防护与医疗", "98%", "high"),
    ("🇸🇦", "沙特·吉达", "210+ 买家", "太阳能光伏板", "89%", "high"),
    ("🇦🇺", "澳大利亚·悉尼", "220+ 买家", "迷你挖掘机", "96%", "high"),
    ("🇩🇪", "德国·纽伦堡", "180+ 买家", "电动汽车电池", "93%", "medium"),
    ("🇧🇷", "巴西·圣保罗", "195+ 买家", "矿山机械配件", "94%", "high"),
    ("🇫🇯", "斐济·苏瓦", "95+ 买家", "暖通空调系统", "92%", "medium"),
    ("🇲🇽", "墨西哥·蒙特雷", "130+ 买家", "工业包装设备", "95%", "medium"),
    ("🇰🇪", "肯尼亚·内罗毕", "150+ 买家", "农业机械", "91%", "medium"),
]

for i, (flag, city, buyers, product, match, intensity) in enumerate(hotspots):
    col = i % 4
    row = i // 4
    x = Inches(0.8 + col * 3.1)
    y = Inches(3.0 + row * 2.1)

    intensity_color = ORANGE if intensity == 'high' else CYAN
    card = add_rect(slide, x, y, Inches(2.85), Inches(1.85),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=intensity_color if intensity == 'high' else BORDER_GRAY,
                    corner_radius=Inches(0.12))

    add_text_box(slide, x + Inches(0.2), y + Inches(0.1), Inches(2.4), Inches(0.3),
                 f"{flag}  {city}", Pt(13), WHITE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')

    badge_text = "高需求" if intensity == 'high' else "增长市场"
    badge = add_rect(slide, x + Inches(1.6), y + Inches(0.12), Inches(1.1), Inches(0.22),
                     fill_color=RGBColor(int(intensity_color[0]/255*20),
                                         int(intensity_color[1]/255*20),
                                         int(intensity_color[2]/255*20)),
                     border_color=RGBColor(int(intensity_color[0]/255*50),
                                           int(intensity_color[1]/255*50),
                                           int(intensity_color[2]/255*50)),
                     corner_radius=Inches(0.08))
    tf = badge.text_frame
    p = tf.paragraphs[0]
    p.text = badge_text
    p.font.size = Pt(7)
    p.font.color.rgb = intensity_color
    p.font.bold = True
    p.font.name = 'Microsoft YaHei'
    p.alignment = PP_ALIGN.CENTER

    add_text_box(slide, x + Inches(0.2), y + Inches(0.55), Inches(2.4), Inches(0.3),
                 f"🛒  {buyers}", Pt(14), WHITE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
    add_text_box(slide, x + Inches(0.2), y + Inches(0.95), Inches(2.4), Inches(0.25),
                 f"热门品类: {product}", Pt(10), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')
    add_text_box(slide, x + Inches(0.2), y + Inches(1.3), Inches(2.4), Inches(0.25),
                 f"匹配度: {match}", Pt(10), EMERALD, True, PP_ALIGN.LEFT, 'Microsoft YaHei')

add_text_box(slide, Inches(1), Inches(7.0), Inches(11.3), Inches(0.3),
             "📡  数据持续刷新。每小时在所有区域检测到新的买家信号。",
             Pt(9), MEDIUM_GRAY, False, PP_ALIGN.CENTER, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 6: 应用场景驱动发现 — APPLICATION-LED DISCOVERY
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "05", "智能发现引擎")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "我们不只搜索关键词——我们寻找应用场景", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.8),
             "TradeNexus 采用应用场景驱动发现——精确分析您的产品在每个目标国家如何被使用，\n"
             "然后精准锁定在这些应用场景中采购的公司。",
             Pt(14), LIGHT_GRAY, False)

# Left: Traditional
add_text_box(slide, Inches(1), Inches(3.2), Inches(5), Inches(0.4),
             "❌  传统 B2B 搜索方式", Pt(16), ORANGE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
trad_box = add_rect(slide, Inches(1), Inches(3.7), Inches(5.3), Inches(2.6),
                    fill_color=RGBColor(0x1A, 0x0F, 0x0F),
                    border_color=RGBColor(0x7F, 0x1D, 0x1D), corner_radius=Inches(0.12))
add_text_box(slide, Inches(1.3), Inches(3.9), Inches(4.7), Inches(2.2),
             "▸  搜索：「澳大利亚太阳能板经销商」\n"
             "▸  结果：通用目录列表、失效链接\n"
             "▸  无上下文：谁在采购？为什么采购？\n"
             "▸  未核验：虚假或过时的联系方式\n"
             "▸  一刀切：所有市场用相同搜索方式\n"
             "▸  全手动：数小时点击、表格整理、痛苦不堪",
             Pt(10.5), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')

# Right: TradeNexus
add_text_box(slide, Inches(7), Inches(3.2), Inches(5), Inches(0.4),
             "✅  TradeNexus 应用场景驱动发现", Pt(16), EMERALD, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
tn_box = add_rect(slide, Inches(7), Inches(3.7), Inches(5.3), Inches(2.6),
                  fill_color=RGBColor(0x0F, 0x1A, 0x0F),
                  border_color=RGBColor(0x16, 0x5E, 0x36), corner_radius=Inches(0.12))
add_text_box(slide, Inches(7.3), Inches(3.9), Inches(4.7), Inches(2.2),
             "▸  AI 分析：该产品在澳大利亚如何被使用？\n"
             "▸  为每个国家绘制 3–10 个具体应用场景\n"
             "▸  每个场景：买家类型、搜索词、资质信号\n"
             "▸  搜索 Google + LinkedIn + Facebook + Instagram\n"
             "▸  核验：Google Maps、社交资料、邮箱、电话\n"
             "▸  全自动：数分钟内生成管线就绪的线索",
             Pt(10.5), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')

highlight = add_rect(slide, Inches(1), Inches(6.6), Inches(11.3), Inches(0.5),
                     fill_color=RGBColor(0x0A, 0x1A, 0x2E),
                     border_color=BLUE_PRIMARY, corner_radius=Inches(0.08))
add_text_box(slide, Inches(1.5), Inches(6.62), Inches(10.3), Inches(0.4),
             "💡  案例：中国太阳能板制造商瞄准澳大利亚 → AI 找到太阳能电站 EPC 承包商、屋顶光伏安装商、"
             "离网矿区运营商、农业水泵系统集成商——每个应用场景均为独立的买家细分群体。",
             Pt(10), CYAN, False, PP_ALIGN.CENTER, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 7: 销售管线 — PIPELINE MANAGEMENT
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "06", "端到端销售管理")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "全流程销售管线——从线索发现到订单成交", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "每条线索都经过结构化管线流转。AI 在每个阶段为您提供智能辅助。",
             Pt(14), LIGHT_GRAY, False)

stages = [
    ("已发现", "AI 找到并筛选\n匹配的公司", BLUE_PRIMARY, "4,500+"),
    ("联系中", "AI 起草个性化\n外联开发信", CYAN, "2,100+"),
    ("洽谈中", "追踪沟通记录、\n报价和后续步骤", ORANGE, "850+"),
    ("已成交", "订单确认。\n开始出口。", EMERALD, "320+"),
]

for i, (name, desc, color, count) in enumerate(stages):
    x = Inches(0.8 + i * 3.15)
    y = Inches(3.2)

    card = add_rect(slide, x, y, Inches(2.9), Inches(2.4),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=color, corner_radius=Inches(0.12))
    add_gradient_bar(slide, x, y, Inches(2.9), Inches(0.06), color, color)

    add_text_box(slide, x + Inches(0.25), y + Inches(0.3), Inches(2.4), Inches(0.4),
                 name, Pt(14), color, True, PP_ALIGN.CENTER, 'Microsoft YaHei')
    add_text_box(slide, x + Inches(0.25), y + Inches(0.8), Inches(2.4), Inches(0.5),
                 count, Pt(28), WHITE, True, PP_ALIGN.CENTER)
    add_text_box(slide, x + Inches(0.25), y + Inches(1.25), Inches(2.4), Inches(0.3),
                 "已处理线索", Pt(9), MEDIUM_GRAY, False, PP_ALIGN.CENTER, 'Microsoft YaHei')
    add_text_box(slide, x + Inches(0.25), y + Inches(1.7), Inches(2.4), Inches(0.6),
                 desc, Pt(10), LIGHT_GRAY, False, PP_ALIGN.CENTER, 'Microsoft YaHei')

    if i < 3:
        arrow = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                       x + Inches(2.95), y + Inches(1.0),
                                       Inches(0.18), Inches(0.35))
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = DARK_GRAY
        arrow.line.fill.background()

features_row = [
    ("📋", "拖拽式\n阶段管理"),
    ("📊", "转化率\n数据分析"),
    ("🤖", "AI 生成\n下一步建议"),
    ("📝", "每条线索\n活动日志"),
    ("📤", "CSV / Excel\n一键导出"),
    ("🔄", "自动巡航\n持续拓客"),
]

for i, (icon, label) in enumerate(features_row):
    x = Inches(0.8 + i * 2.1)
    add_text_box(slide, x, Inches(6.0), Inches(1.9), Inches(1.0),
                 f"{icon}\n{label}", Pt(9), LIGHT_GRAY, False, PP_ALIGN.CENTER, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 8: 市场情报 — MARKET INTELLIGENCE
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "07", "市场情报报告")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "为每个目标市场生成深度情报报告", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "AI 生成的报告涵盖您进入新市场所需的一切——从 HS 编码到竞争对手分析，一应俱全。",
             Pt(14), LIGHT_GRAY, False)

report_items = [
    ("📈", "市场概况\n与规模"),
    ("🏷️", "HS 编码\n策略建议"),
    ("💰", "进口关税与\n定价结构"),
    ("🚢", "物流时效\n与运输方案"),
    ("🏢", "竞争对手\n份额分析"),
    ("📋", "法规合规\n要求解读"),
    ("🎯", "市场准入\n策略建议"),
    ("🤝", "行业展会\n与商务活动"),
    ("🌍", "本地化\n适配要求"),
    ("📊", "增长趋势\n与市场预测"),
    ("👥", "用户细分\n群体分析"),
    ("📄", "可导出\nPDF 报告"),
]

for i, (icon, label) in enumerate(report_items):
    col = i % 4
    row = i // 4
    x = Inches(0.8 + col * 3.15)
    y = Inches(3.0 + row * 1.45)

    card = add_rect(slide, x, y, Inches(2.9), Inches(1.25),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=BORDER_GRAY, corner_radius=Inches(0.1))
    add_text_box(slide, x + Inches(0.25), y + Inches(0.2), Inches(2.4), Inches(0.8),
                 f"{icon}  {label}", Pt(11), WHITE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')

add_text_box(slide, Inches(1), Inches(6.8), Inches(11.3), Inches(0.4),
             "💡  所有报告数据均通过 Google Search 实时验证——非静态数据库内容。",
             Pt(10), CYAN, False, PP_ALIGN.CENTER, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 9: 真实案例 — REAL RESULTS
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "08", "实战效果验证")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "真实线索、真实公司、真实出口商机", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "以下所有案例均来自 TradeNexus AI 的真实搜索会话。已核验公司，真实联系方式。",
             Pt(14), LIGHT_GRAY, False)

cases = [
    ("🇦🇺", "澳大利亚", "迷你挖掘机", "中国 OEM 制造商瞄准设备租赁公司",
     [("Sydney Machinery Hire", "95%", "悉尼及新南威尔士州干租车队"),
      ("Cornfoot Bros Earthmoving", "95%", "100+ 台设备服务维多利亚州民用工程"),
      ("ACE Rental", "95%", "200+ 台设备服务昆士兰东南部基建")],
     True),
    ("🇸🇦", "沙特阿拉伯", "太阳能光伏板", "中国制造商瞄准 Vision 2030 光伏 EPC 承包商",
     [("Desert Technologies", "85%", "吉达光伏制造商、开发商及 EPC 承包商"),
      ("National Solar Systems", "85%", "达曼领先光伏 EPC 承包商"),
      ("Ishraq Solar Energy", "85%", "全球太阳能产品进口批发商")],
     True),
    ("🇫🇯", "斐济", "暖通空调系统", "中国制造商瞄准度假村开发商",
     [("Kooline Air Conditioning", "85%", "1975 年成立，苏瓦和楠迪设有分公司"),
      ("Mechanical Services Ltd", "85%", "大金 VRF 经销商，180+ 员工"),
      ("Rainbow Cool Tech Fiji", "85%", "大型酒店及度假村暖通空调工程")],
     True),
]

for i, (flag, country, product, context, leads, is_real) in enumerate(cases):
    x = Inches(0.8 + i * 4.1)
    y = Inches(3.0)

    card = add_rect(slide, x, y, Inches(3.85), Inches(3.8),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=EMERALD if is_real else BORDER_GRAY,
                    corner_radius=Inches(0.12))

    add_text_box(slide, x + Inches(0.25), y + Inches(0.15), Inches(3.35), Inches(0.35),
                 f"{flag}  {country}  ·  {product}", Pt(14), WHITE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
    if is_real:
        badge = add_rect(slide, x + Inches(2.5), y + Inches(0.15), Inches(1.15), Inches(0.22),
                         fill_color=RGBColor(0x0A, 0x3A, 0x1A),
                         border_color=RGBColor(0x16, 0x5E, 0x36),
                         corner_radius=Inches(0.06))
        tf = badge.text_frame
        p = tf.paragraphs[0]
        p.text = "✓ 真实数据"
        p.font.size = Pt(7)
        p.font.color.rgb = EMERALD
        p.font.bold = True
        p.font.name = 'Microsoft YaHei'
        p.alignment = PP_ALIGN.CENTER

    add_text_box(slide, x + Inches(0.25), y + Inches(0.6), Inches(3.35), Inches(0.5),
                 context, Pt(9), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')

    for j, (company, score, detail) in enumerate(leads):
        ly = y + Inches(1.3 + j * 0.75)
        lead_card = add_rect(slide, x + Inches(0.15), ly, Inches(3.55), Inches(0.65),
                             fill_color=RGBColor(0x08, 0x12, 0x22),
                             border_color=BORDER_GRAY, corner_radius=Inches(0.08))
        add_text_box(slide, x + Inches(0.3), ly + Inches(0.05), Inches(2.5), Inches(0.25),
                     company, Pt(10), WHITE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
        add_text_box(slide, x + Inches(0.3), ly + Inches(0.32), Inches(2.5), Inches(0.25),
                     detail, Pt(7.5), MEDIUM_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')
        add_text_box(slide, x + Inches(2.9), ly + Inches(0.15), Inches(0.7), Inches(0.25),
                     f"{score}", Pt(10), BLUE_PRIMARY, True, PP_ALIGN.LEFT, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 10: 无人值守 — AUTO-PILOT
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "09", "24/7 自主巡航")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "开启自动巡航，无需值守——AI 持续为您拓客", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.8),
             "打开自动巡航后，TradeNexus 持续寻找新买家，自动学习哪些渠道效果最好，\n"
             "并将搜索资源动态分配给高转化率的应用场景。",
             Pt(14), LIGHT_GRAY, False)

ap_features = [
    ("🔄", "自动\n重复扫描", "每隔几分钟运行一次。\n在您专注成交时，\n持续发现新线索。"),
    ("🧠", "自学习\n优化引擎", "追踪哪些应用场景和渠道\n转化率最高。\n自动调整搜索预算分配。"),
    ("🎯", "智能\n优先级排序", "聚焦高需求区域。\n自动跳过低效渠道。\n最大化每个周期的 ROI。"),
    ("📱", "后台\n静默运行", "即使您退出登录也在工作。\n下次登录时，\n新线索已在管线中等待。"),
    ("📊", "渠道表现\n数据分析", "每个搜索渠道的转化率。\n清晰了解哪些买家细分\n群体正在产生效果。"),
    ("🔔", "新线索\n实时提醒", "新的已验证线索自动\n出现在您的管线中。\n无需手动检查。"),
]

for i, (icon, title, desc) in enumerate(ap_features):
    col = i % 3
    row = i // 3
    x = Inches(1 + col * 3.9)
    y = Inches(3.2 + row * 2.0)

    card = add_rect(slide, x, y, Inches(3.6), Inches(1.75),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=BORDER_GRAY, corner_radius=Inches(0.12))
    add_text_box(slide, x + Inches(0.25), y + Inches(0.15), Inches(3.1), Inches(0.45),
                 f"{icon}  {title}", Pt(14), WHITE, True, PP_ALIGN.LEFT, 'Microsoft YaHei')
    add_text_box(slide, x + Inches(0.25), y + Inches(0.65), Inches(3.1), Inches(0.9),
                 desc, Pt(10), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 11: 竞品对比 — WHY TRADENEXUS
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "10", "为什么选择 TradeNexus")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "TradeNexus 的差异化优势", Pt(34), WHITE, True)

# Headers
headers = ["", "TradeNexus AI", "行业展会", "B2B 数据库", "手动调研"]
col_widths = [Inches(2.8), Inches(2.6), Inches(2.6), Inches(2.6), Inches(2.6)]
col_starts = [Inches(0.7)]
for w in col_widths[:-1]:
    col_starts.append(Inches(col_starts[-1]) + w)

for j, (header, x, w) in enumerate(zip(headers, col_starts, col_widths)):
    bg = BLUE_PRIMARY if j == 1 else DARK_GRAY
    cell = add_rect(slide, x, Inches(2.8), w - Inches(0.1), Inches(0.45), fill_color=bg)
    add_text_box(slide, x + Inches(0.1), Inches(2.82), w - Inches(0.3), Inches(0.4),
                 header, Pt(11), WHITE, True, PP_ALIGN.CENTER, 'Microsoft YaHei')

rows_data = [
    ("单次活动成本", "免费起步", "15万–80万+", "3万–10万/年", "数百小时人工"),
    ("买家核验", "✅ 实时核验", "❌ 名片而已", "⚠️ 经常过时", "❌ 自行调研"),
    ("获取首条线索", "⏱️ ~3分钟", "3–6个月筹备", "即时(未核验)", "数天至数周"),
    ("全球覆盖", "190+ 国家", "1–3 个国家", "数据集有限", "取决于个人能力"),
    ("AI 个性化", "✅ 按买家定制", "❌ 通用话术", "❌ 模板化", "❌ 纯手工"),
    ("多渠道搜索", "Google + 6社交平台", "仅限面对面", "仅限邮件", "仅限Google"),
    ("24/7 自动运行", "✅ 支持", "❌ 不支持", "❌ 不支持", "❌ 不支持"),
    ("市场情报", "完整深度报告", "仅有宣传册", "基础筛选条件", "自行整理"),
]

for i, row_data in enumerate(rows_data):
    y = Inches(3.35 + i * 0.48)
    bg_color = RGBColor(0x0F, 0x1A, 0x2E) if i % 2 == 0 else RGBColor(0x08, 0x12, 0x22)

    for j, (cell_text, x, w) in enumerate(zip(row_data, col_starts, col_widths)):
        cell = add_rect(slide, x, y, w - Inches(0.1), Inches(0.42), fill_color=bg_color)

        text_color = EMERALD if "✅" in cell_text or "免费" in cell_text or "~3" in cell_text else \
                     ORANGE if "❌" in cell_text or "15万" in cell_text or "数百" in cell_text else \
                     CYAN if "⏱️" in cell_text else \
                     WHITE if j == 0 else LIGHT_GRAY

        add_text_box(slide, x + Inches(0.12), y + Inches(0.05), w - Inches(0.35), Inches(0.35),
                     cell_text, Pt(9.5), text_color, j == 0,
                     PP_ALIGN.CENTER if j > 0 else PP_ALIGN.LEFT, 'Microsoft YaHei')

add_text_box(slide, Inches(1), Inches(7.1), Inches(11.3), Inches(0.3),
             "🏆  TradeNexus 集各方案之所长：AI 的速度 + 人工级别的核验质量 + 持续自主运行。",
             Pt(10), EMERALD, False, PP_ALIGN.CENTER, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SLIDE 12: 立即开始 — GET STARTED / CTA
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide, DARKER_BG)

add_gradient_bar(slide, Inches(0), Inches(0), Inches(13.333), Inches(0.08), BLUE_PRIMARY, CYAN)

add_text_box(slide, Inches(1), Inches(1.8), Inches(11.3), Inches(0.6),
             "准备好找到您的下一个买家了吗？", Pt(42), WHITE, True, PP_ALIGN.CENTER, 'Microsoft YaHei')

add_text_box(slide, Inches(2), Inches(2.8), Inches(9.3), Inches(1.0),
             "加入使用 TradeNexus AI 的制造商和出口商行列\n"
             "在全球 190+ 国家发现已验证的 B2B 买家——从今天开始。",
             Pt(16), LIGHT_GRAY, False, PP_ALIGN.CENTER, 'Microsoft YaHei')

# CTA Button
cta_btn = add_rect(slide, Inches(4.2), Inches(4.0), Inches(5.0), Inches(0.8),
                   fill_color=BLUE_PRIMARY, corner_radius=Inches(0.15))
tf = cta_btn.text_frame
p = tf.paragraphs[0]
p.text = "免费开始拓客  →"
p.font.size = Pt(18)
p.font.color.rgb = WHITE
p.font.bold = True
p.font.name = 'Microsoft YaHei'
p.alignment = PP_ALIGN.CENTER

# Bottom stats
add_stat_card(slide, Inches(1.5), Inches(5.4), Inches(2.4), Inches(1.0), "190+", "覆盖国家", CYAN)
add_stat_card(slide, Inches(4.2), Inches(5.4), Inches(2.4), Inches(1.0), "3 分钟", "获取首条线索", EMERALD)
add_stat_card(slide, Inches(6.9), Inches(5.4), Inches(2.4), Inches(1.0), "24/7", "全天候自主运行", BLUE_PRIMARY)
add_stat_card(slide, Inches(9.6), Inches(5.4), Inches(2.4), Inches(1.0), "免费", "立即起步", EMERALD)

add_gradient_bar(slide, Inches(0), Inches(7.42), Inches(13.333), Inches(0.08), BLUE_PRIMARY, CYAN)

add_text_box(slide, Inches(3), Inches(6.8), Inches(7.3), Inches(0.4),
             "tradenexus.ai  ·  AI 赋能 B2B 外贸拓客平台", Pt(10), MEDIUM_GRAY, False, PP_ALIGN.CENTER, 'Microsoft YaHei')

# ═══════════════════════════════════════════════════════════════
# SAVE
# ═══════════════════════════════════════════════════════════════
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'TradeNexus_Pitch_Deck_CN.pptx')
prs.save(output_path)
print(f"✅ 中文版 PPT 已保存至: {output_path}")
print(f"📊 幻灯片数量: {len(prs.slides)}")
