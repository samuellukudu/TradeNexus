#!/usr/bin/env python3
"""
TradeNexus AI Sales Agent — Pitch Deck Generator
Creates a professional presentation for pitching to suppliers, manufacturers, and businesses.
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

prs = Presentation()
prs.slide_width = Inches(13.333)   # 16:9 widescreen
prs.slide_height = Inches(7.5)

# ── Helper Functions ──

def add_dark_background(slide, color=DARK_BG):
    """Fill slide background with dark color."""
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_gradient_bar(slide, left, top, width, height, color1=BLUE_PRIMARY, color2=CYAN):
    """Add a gradient accent bar (simulated with solid shapes)."""
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color1
    shape.line.fill.background()
    return shape

def add_rect(slide, left, top, width, height, fill_color=None, border_color=None, corner_radius=None):
    """Add a rounded rectangle."""
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
                 color=WHITE, bold=False, alignment=PP_ALIGN.LEFT, font_name='Outfit',
                 line_spacing=1.2):
    """Add a text box with specified formatting."""
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

def add_multiline_text(slide, left, top, width, height, lines, font_name='Outfit'):
    """Add a text box with multiple formatted lines. Each line is (text, font_size, color, bold, alignment)."""
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

def add_badge(slide, left, top, text, color=BLUE_PRIMARY):
    """Add a small pill badge."""
    shape = add_rect(slide, left, top, Inches(3.0), Inches(0.35),
                     fill_color=color, corner_radius=Inches(0.2))
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(
        min(color[0] + 100, 255) if isinstance(color, tuple) else color
    )
    # Actually let's just use a text-based badge
    badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(2.8), Inches(0.32))
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(
        int(color[0]/255 * 30), int(color[1]/255 * 30), int(color[2]/255 * 30)
    )
    badge.line.color.rgb = RGBColor(
        int(color[0]/255 * 80), int(color[1]/255 * 80), int(color[2]/255 * 80)
    )
    badge.line.width = Pt(0.5)
    tf = badge.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(9)
    p.font.color.rgb = color
    p.font.bold = True
    p.font.name = 'Outfit'
    p.alignment = PP_ALIGN.CENTER
    return badge

def add_stat_card(slide, left, top, width, height, number, label, num_color=CYAN):
    """Add a stat/metric card."""
    card = add_rect(slide, left, top, width, height,
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=RGBColor(0x1E, 0x29, 0x3B),
                    corner_radius=Inches(0.15))
    # Number
    add_text_box(slide, left + Inches(0.3), top + Inches(0.2), width - Inches(0.6), Inches(0.6),
                 number, Pt(36), num_color, True, PP_ALIGN.LEFT)
    # Label
    add_text_box(slide, left + Inches(0.3), top + Inches(0.7), width - Inches(0.6), Inches(0.4),
                 label, Pt(10), MEDIUM_GRAY, False, PP_ALIGN.LEFT)
    return card

def add_section_header(slide, section_num, title_text):
    """Add consistent section header."""
    # Accent bar
    add_gradient_bar(slide, Inches(0), Inches(0), Inches(13.333), Inches(0.06), BLUE_PRIMARY)
    # Section number + title
    add_text_box(slide, Inches(1), Inches(0.4), Inches(11), Inches(0.5),
                 f"{section_num}  ▸  {title_text}", Pt(11), CYAN, True, PP_ALIGN.LEFT, 'Outfit')

def add_title_and_subtitle(slide, title, subtitle=None, title_size=Pt(36)):
    """Add title and optional subtitle."""
    add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(1.0),
                 title, title_size, WHITE, True, PP_ALIGN.LEFT, 'Outfit')
    if subtitle:
        add_text_box(slide, Inches(1), Inches(2.2), Inches(11.3), Inches(0.8),
                     subtitle, Pt(16), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Outfit')

# ═══════════════════════════════════════════════════════════════
# SLIDE 1: TITLE SLIDE
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
add_dark_background(slide, DARKER_BG)

# Decorative elements
add_gradient_bar(slide, Inches(0), Inches(0), Inches(13.333), Inches(0.08), BLUE_PRIMARY, CYAN)
add_rect(slide, Inches(9), Inches(2.5), Inches(4), Inches(4),
         fill_color=RGBColor(0x1E, 0x40, 0xAF), border_color=None, corner_radius=None)
# Make it a subtle glow circle
glow = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9.5), Inches(1.5), Inches(5), Inches(5))
glow.fill.solid()
glow.fill.fore_color.rgb = BLUE_PRIMARY
glow.fill.fore_color.brightness = 0.95  # very dim
glow.line.fill.background()

# Logo area
add_text_box(slide, Inches(1), Inches(1.0), Inches(6), Inches(0.6),
             "⬡  TradeNexus", Pt(16), CYAN, True, PP_ALIGN.LEFT, 'Outfit')

# Main title
add_multiline_text(slide, Inches(1), Inches(2.5), Inches(7.5), Inches(2.0), [
    ("Global Demand Meets", Pt(48), WHITE, True, PP_ALIGN.LEFT),
    ("Your Supply. Instantly.", Pt(48), CYAN, True, PP_ALIGN.LEFT),
])

# Subtitle
add_text_box(slide, Inches(1), Inches(4.2), Inches(7), Inches(1.0),
             "Autonomous AI Sales Agents That Find, Verify, and Fill Your Pipeline\n"
             "With Qualified B2B Buyers — 24 Hours a Day, Across 190+ Countries.",
             Pt(16), LIGHT_GRAY, False, PP_ALIGN.LEFT, 'Outfit')

# Bottom stats
add_stat_card(slide, Inches(1), Inches(5.5), Inches(2.0), Inches(1.0), "190+", "Countries Scouted", CYAN)
add_stat_card(slide, Inches(3.3), Inches(5.5), Inches(2.0), Inches(1.0), "4,500+", "Active Buyers Detected", EMERALD)
add_stat_card(slide, Inches(5.6), Inches(5.5), Inches(2.0), Inches(1.0), "98%", "Match Accuracy", BLUE_PRIMARY)

# Bottom accent
add_gradient_bar(slide, Inches(0), Inches(7.42), Inches(13.333), Inches(0.08), BLUE_PRIMARY, CYAN)

# Tagline bottom right
add_text_box(slide, Inches(8.5), Inches(6.8), Inches(4), Inches(0.5),
             "AI-Powered B2B Prospecting Platform", Pt(10), MEDIUM_GRAY, False, PP_ALIGN.RIGHT, 'Outfit')

# ═══════════════════════════════════════════════════════════════
# SLIDE 2: THE PROBLEM
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "01", "THE CHALLENGE")

# Problem statement
add_text_box(slide, Inches(1), Inches(1.2), Inches(11), Inches(0.8),
             "B2B Export Is Broken for Manufacturers", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11), Inches(0.6),
             "Suppliers waste millions on trade shows, cold emails, and unverified lead lists — with no pipeline to show for it.",
             Pt(14), LIGHT_GRAY, False)

# Problem cards
problems = [
    ("🔍", "Manual Research Is Slow", "Teams spend weeks Googling buyers,\nscraping directories, and guessing who to contact."),
    ("💸", "Trade Shows Are Expensive", "$20K–$100K per show. 3 days. Hundreds\nof business cards. Near-zero follow-through."),
    ("📉", "Unverified Lead Lists", "Purchased B2B lists have 30–50% bounce rates.\nOutdated contacts. Wrong industries. No context."),
    ("🌍", "Language & Cultural Barriers", "Reaching buyers in 190 countries requires\nlocal market knowledge suppliers don't have."),
    ("⏳", "No Follow-Up System", "Even when a lead is found, there's no systematic\nway to nurture, track, and close across time zones."),
    ("🚫", "Missed Opportunities", "Buyers ARE searching for your products right now.\nYou just don't know who they are or where to find them."),
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
                 f"{icon}  {title}", Pt(13), WHITE, True)
    add_text_box(slide, x + Inches(0.25), y + Inches(0.6), Inches(3.1), Inches(1.1),
                 desc, Pt(10), LIGHT_GRAY, False)

# ═══════════════════════════════════════════════════════════════
# SLIDE 3: THE SOLUTION
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "02", "THE SOLUTION")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11), Inches(0.8),
             "TradeNexus AI: Your Autonomous Global Sales Force", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.8),
             "Describe your product once. Our AI agents find verified buyers, analyze markets,\n"
             "qualify companies, and draft personalized outreach — automatically, around the clock.",
             Pt(14), LIGHT_GRAY, False)

# Feature highlights with descriptions
features = [
    ("🧠", "AI Product\nUnderstanding", "Upload a spec sheet or describe\nyour product. AI extracts technical\nspecs, certifications, and ideal\nbuyer profiles automatically.", BLUE_PRIMARY),
    ("🌐", "Global Buyer\nDiscovery", "Autonomous agents search 190+\ncountries across Google, social\nmedia, trade directories, and\nchambers of commerce.", CYAN),
    ("✅", "Real-Time\nVerification", "Every lead is verified: Google\nMaps business presence, social\nprofile cross-check, email & phone\nvalidation against live sources.", EMERALD),
    ("📊", "Market\nIntelligence", "Per-region reports with HS codes,\nimport duties, competitor share,\ngrowth trends, pricing structure,\nand entry strategy — all sourced.", ORANGE),
    ("🤖", "24/7\nAuto-Pilot", "Turn it on and walk away. AI\nre-scouts your markets every few\nminutes, learning which channels\nperform best over time.", INDIGO),
    ("✉️", "AI Outreach\nDrafts", "Personalized cold emails, LinkedIn\nmessages, WhatsApp texts, and\ndistributor pitches — drafted per\nlead, per market, per buyer type.", BLUE_PRIMARY),
]

for i, (icon, title, desc, accent) in enumerate(features):
    col = i % 3
    row = i // 3
    x = Inches(1 + col * 3.9)
    y = Inches(3.0 + row * 2.1)

    card = add_rect(slide, x, y, Inches(3.6), Inches(1.85),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=BORDER_GRAY, corner_radius=Inches(0.12))
    # Accent top bar
    add_gradient_bar(slide, x, y, Inches(3.6), Inches(0.05), accent, accent)

    add_text_box(slide, x + Inches(0.25), y + Inches(0.2), Inches(3.1), Inches(0.5),
                 f"{icon}  {title}", Pt(13), WHITE, True)
    add_text_box(slide, x + Inches(0.25), y + Inches(0.7), Inches(3.1), Inches(1.0),
                 desc, Pt(9.5), LIGHT_GRAY, False)

# ═══════════════════════════════════════════════════════════════
# SLIDE 4: HOW IT WORKS
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "03", "HOW IT WORKS")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "3 Simple Steps From Product to Pipeline", Pt(34), WHITE, True)
add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "No manual research. No expensive databases. No sales team required.",
             Pt(14), LIGHT_GRAY, False)

steps = [
    ("1", "Describe Your\nProduct",
     "Upload a PDF spec sheet, paste a\ndescription, or just name your\nproduct. Our AI extracts specs,\ncertifications, ideal buyer profiles,\nand value propositions.",
     BLUE_PRIMARY),
    ("2", "AI Scouts\nGlobal Markets",
     "Autonomous agents search 190+\ncountries using application-led\ndiscovery. They find buyers across\nGoogle, LinkedIn, Facebook,\nInstagram, and trade directories.",
     CYAN),
    ("3", "Contact\nand Close",
     "Get verified emails, phone numbers,\nsocial profiles, and AI-generated\noutreach messages. Track every\nlead through your pipeline from\ndiscovery to closed deal.",
     EMERALD),
]

for i, (num, title, desc, accent) in enumerate(steps):
    x = Inches(1 + i * 4.0)
    y = Inches(3.0)

    # Step number circle
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
    p.font.name = 'Outfit'
    p.alignment = PP_ALIGN.CENTER

    # Arrow between steps
    if i < 2:
        arrow = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                       x + Inches(2.6), y + Inches(0.4),
                                       Inches(1.0), Inches(0.4))
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = DARK_GRAY
        arrow.line.fill.background()

    # Title
    add_text_box(slide, x + Inches(0.3), y + Inches(1.5), Inches(3.2), Inches(0.6),
                 title, Pt(18), WHITE, True, PP_ALIGN.CENTER)
    # Description
    add_text_box(slide, x + Inches(0.3), y + Inches(2.3), Inches(3.2), Inches(2.0),
                 desc, Pt(11), LIGHT_GRAY, False, PP_ALIGN.CENTER)

# Bottom note
add_text_box(slide, Inches(1), Inches(6.5), Inches(11.3), Inches(0.4),
             "⚡  Average time from product description to first verified leads: under 3 minutes.",
             Pt(11), EMERALD, True, PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════
# SLIDE 5: GLOBAL COVERAGE
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "04", "GLOBAL COVERAGE")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "Real-Time Demand Across 190+ Countries", Pt(34), WHITE, True)
add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "Our AI agents monitor global B2B procurement signals 24/7. These are real hotspots detected by the platform:",
             Pt(14), LIGHT_GRAY, False)

# Hotspot data cards - 8 regions in 2 rows of 4
hotspots = [
    ("🇦🇪", "Dubai, UAE", "320+ Buyers", "PPE & Medical", "98%", "high"),
    ("🇸🇦", "Jeddah, Saudi Arabia", "210+ Buyers", "Solar Panels", "89%", "high"),
    ("🇦🇺", "Sydney, Australia", "220+ Buyers", "Mini Excavators", "96%", "high"),
    ("🇩🇪", "Nuremberg, Germany", "180+ Buyers", "EV Batteries", "93%", "medium"),
    ("🇧🇷", "São Paulo, Brazil", "195+ Buyers", "Mining Parts", "94%", "high"),
    ("🇫🇯", "Suva, Fiji", "95+ Buyers", "HVAC Systems", "92%", "medium"),
    ("🇲🇽", "Monterrey, Mexico", "130+ Buyers", "Packaging Machines", "95%", "medium"),
    ("🇰🇪", "Nairobi, Kenya", "150+ Buyers", "Agri Machinery", "91%", "medium"),
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

    # Flag and city
    add_text_box(slide, x + Inches(0.2), y + Inches(0.1), Inches(2.4), Inches(0.3),
                 f"{flag}  {city}", Pt(13), WHITE, True)
    # Intensity badge
    badge_text = "HIGH DEMAND" if intensity == 'high' else "GROWING MARKET"
    badge = add_rect(slide, x + Inches(1.55), y + Inches(0.12), Inches(1.15), Inches(0.22),
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
    p.font.name = 'Outfit'
    p.alignment = PP_ALIGN.CENTER

    # Stats
    add_text_box(slide, x + Inches(0.2), y + Inches(0.55), Inches(2.4), Inches(0.3),
                 f"🛒  {buyers}", Pt(14), WHITE, True)
    add_text_box(slide, x + Inches(0.2), y + Inches(0.95), Inches(2.4), Inches(0.25),
                 f"Top: {product}", Pt(10), LIGHT_GRAY, False)
    add_text_box(slide, x + Inches(0.2), y + Inches(1.3), Inches(2.4), Inches(0.25),
                 f"Match: {match}", Pt(10), EMERALD, True)

# Bottom note
add_text_box(slide, Inches(1), Inches(7.0), Inches(11.3), Inches(0.3),
             "📡  Data refreshed continuously. New buyer signals detected every hour across all regions.",
             Pt(9), MEDIUM_GRAY, False, PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════
# SLIDE 6: APPLICATION-LED DISCOVERY
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "05", "INTELLIGENT DISCOVERY")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "We Don't Just Search Keywords. We Find Applications.", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.8),
             "TradeNexus uses application-led discovery — mapping exactly how your product is used in each target country,\n"
             "then finding the specific companies that buy for those applications.",
             Pt(14), LIGHT_GRAY, False)

# Comparison: Traditional vs Application-Led
# Left: Traditional
add_text_box(slide, Inches(1), Inches(3.2), Inches(5), Inches(0.4),
             "❌  Traditional B2B Search", Pt(16), ORANGE, True)
trad_box = add_rect(slide, Inches(1), Inches(3.7), Inches(5.3), Inches(2.6),
                    fill_color=RGBColor(0x1A, 0x0F, 0x0F),
                    border_color=RGBColor(0x7F, 0x1D, 0x1D), corner_radius=Inches(0.12))
add_text_box(slide, Inches(1.3), Inches(3.9), Inches(4.7), Inches(2.2),
             "▸  Search: \"solar panel distributors Australia\"\n"
             "▸  Get: generic directory listings, dead links\n"
             "▸  No context: who buys what and why?\n"
             "▸  No verification: fake or outdated contacts\n"
             "▸  One-size-fits-all: same search for every market\n"
             "▸  Manual: hours of clicking, spreadsheets, pain",
             Pt(10.5), LIGHT_GRAY, False)

# Right: TradeNexus
add_text_box(slide, Inches(7), Inches(3.2), Inches(5), Inches(0.4),
             "✅  TradeNexus Application-Led Discovery", Pt(16), EMERALD, True)
tn_box = add_rect(slide, Inches(7), Inches(3.7), Inches(5.3), Inches(2.6),
                  fill_color=RGBColor(0x0F, 0x1A, 0x0F),
                  border_color=RGBColor(0x16, 0x5E, 0x36), corner_radius=Inches(0.12))
add_text_box(slide, Inches(7.3), Inches(3.9), Inches(4.7), Inches(2.2),
             "▸  AI analyzes: how is this product used in Australia?\n"
             "▸  Maps 3–10 specific applications per country\n"
             "▸  For each: buyer type, search terms, qualification signals\n"
             "▸  Searches Google + LinkedIn + Facebook + Instagram\n"
             "▸  Verifies: Google Maps, social profiles, email, phone\n"
             "▸  Automatic: pipeline-ready leads in minutes",
             Pt(10.5), LIGHT_GRAY, False)

# Bottom highlight
highlight = add_rect(slide, Inches(1), Inches(6.6), Inches(11.3), Inches(0.5),
                     fill_color=RGBColor(0x0A, 0x1A, 0x2E),
                     border_color=BLUE_PRIMARY, corner_radius=Inches(0.08))
add_text_box(slide, Inches(1.5), Inches(6.62), Inches(10.3), Inches(0.4),
             "💡  Example: A Chinese solar panel maker targeting Australia → AI finds EPC contractors for solar farms, "
             "rooftop PV installers, off-grid mining operations, and agricultural water pump systems — each as a distinct buyer segment.",
             Pt(10), CYAN, False, PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════
# SLIDE 7: PIPELINE MANAGEMENT
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "06", "END-TO-END PIPELINE")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "Full Pipeline Automation — From Discovery to Closed Deal", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "Every lead flows through a structured pipeline. AI assists at every stage.",
             Pt(14), LIGHT_GRAY, False)

# Pipeline stages
stages = [
    ("DISCOVERED", "AI finds and qualifies\nmatching companies", BLUE_PRIMARY, "4,500+"),
    ("CONTACTING", "AI drafts personalized\noutreach messages", CYAN, "2,100+"),
    ("NEGOTIATING", "Track conversations,\nquotes, and next steps", ORANGE, "850+"),
    ("CLOSED WON", "Deal secured.\nExport begins.", EMERALD, "320+"),
]

for i, (name, desc, color, count) in enumerate(stages):
    x = Inches(0.8 + i * 3.15)
    y = Inches(3.2)

    # Stage card
    card = add_rect(slide, x, y, Inches(2.9), Inches(2.4),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=color, corner_radius=Inches(0.12))
    add_gradient_bar(slide, x, y, Inches(2.9), Inches(0.06), color, color)

    # Stage name
    add_text_box(slide, x + Inches(0.25), y + Inches(0.3), Inches(2.4), Inches(0.4),
                 name, Pt(14), color, True, PP_ALIGN.CENTER)
    # Count
    add_text_box(slide, x + Inches(0.25), y + Inches(0.8), Inches(2.4), Inches(0.5),
                 count, Pt(28), WHITE, True, PP_ALIGN.CENTER)
    add_text_box(slide, x + Inches(0.25), y + Inches(1.25), Inches(2.4), Inches(0.3),
                 "Leads Processed", Pt(9), MEDIUM_GRAY, False, PP_ALIGN.CENTER)
    # Description
    add_text_box(slide, x + Inches(0.25), y + Inches(1.7), Inches(2.4), Inches(0.6),
                 desc, Pt(10), LIGHT_GRAY, False, PP_ALIGN.CENTER)

    # Arrow
    if i < 3:
        arrow = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                       x + Inches(2.95), y + Inches(1.0),
                                       Inches(0.18), Inches(0.35))
        arrow.fill.solid()
        arrow.fill.fore_color.rgb = DARK_GRAY
        arrow.line.fill.background()

# Bottom: Pipeline features
features_row = [
    ("📋", "Drag & Drop\nStage Management"),
    ("📊", "Conversion Rate\nAnalytics"),
    ("🤖", "AI-Generated\nNext Best Actions"),
    ("📝", "Activity Logs\nPer Lead"),
    ("📤", "CSV / Excel\nExport"),
    ("🔄", "Auto-Pilot\nRe-scouting"),
]

for i, (icon, label) in enumerate(features_row):
    x = Inches(0.8 + i * 2.1)
    add_text_box(slide, x, Inches(6.0), Inches(1.9), Inches(1.0),
                 f"{icon}\n{label}", Pt(9), LIGHT_GRAY, False, PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════
# SLIDE 8: MARKET INTELLIGENCE
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "07", "MARKET INTELLIGENCE REPORTS")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "Deep Market Intelligence for Every Target Region", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "AI-generated reports with everything you need to enter a new market — HS codes to competitor analysis.",
             Pt(14), LIGHT_GRAY, False)

# Report feature cards
report_items = [
    ("📈", "Market Overview\n& Size"),
    ("🏷️", "HS Code\nStrategy"),
    ("💰", "Import Duty &\nPricing Structure"),
    ("🚢", "Shipping Time\n& Logistics"),
    ("🏢", "Competitor\nShare Analysis"),
    ("📋", "Regulatory\nCompliance"),
    ("🎯", "Entry Strategy\nRecommendations"),
    ("🤝", "Trade Shows\n& Events"),
    ("🌍", "Localization\nRequirements"),
    ("📊", "Growth Trends\n& Forecasts"),
    ("👥", "User Segment\nAnalysis"),
    ("📄", "Export-Ready\nPDF Reports"),
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
                 f"{icon}  {label}", Pt(11), WHITE, True)

# Bottom
add_text_box(slide, Inches(1), Inches(6.8), Inches(11.3), Inches(0.4),
             "💡  All reports sourced with live web data via Google Search grounding — not static databases.",
             Pt(10), CYAN, False, PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════
# SLIDE 9: REAL RESULTS
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "08", "VERIFIED RESULTS")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "Real Leads, Real Companies, Real Export Opportunities", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.5),
             "Every case study below was generated by TradeNexus AI. Verified companies with real contact data.",
             Pt(14), LIGHT_GRAY, False)

# Case study cards
cases = [
    ("🇦🇺", "Australia", "Mini Excavators", "Chinese OEM targeting equipment hire companies",
     [("Sydney Machinery Hire", "95%", "Dry hire fleet across Sydney & NSW"),
      ("Cornfoot Bros Earthmoving", "95%", "100+ machines for civil construction"),
      ("ACE Rental", "95%", "200+ fleet, SE Queensland infrastructure")],
     True),
    ("🇸🇦", "Saudi Arabia", "Solar Panels", "Manufacturer targeting Vision 2030 EPC contractors",
     [("Desert Technologies", "85%", "PV manufacturer, EPC & O&M in Jeddah"),
      ("National Solar Systems", "85%", "Leading EPC, Dammam"),
      ("Ishraq Solar Energy", "85%", "Imports & wholesales global solar")],
     True),
    ("🇫🇯", "Fiji", "HVAC Systems", "Manufacturer targeting resort developers",
     [("Kooline Air Conditioning", "85%", "Primary HVAC contractor since 1975"),
      ("Mechanical Services Ltd", "85%", "Daikin VRF distributor, 180+ staff"),
      ("Rainbow Cool Tech Fiji", "85%", "Large-scale resort HVAC")],
     True),
]

for i, (flag, country, product, context, leads, is_real) in enumerate(cases):
    x = Inches(0.8 + i * 4.1)
    y = Inches(3.0)

    card = add_rect(slide, x, y, Inches(3.85), Inches(3.8),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=EMERALD if is_real else BORDER_GRAY,
                    corner_radius=Inches(0.12))

    # Header
    add_text_box(slide, x + Inches(0.25), y + Inches(0.15), Inches(3.35), Inches(0.35),
                 f"{flag}  {country}  ·  {product}", Pt(14), WHITE, True)
    if is_real:
        badge = add_rect(slide, x + Inches(2.5), y + Inches(0.15), Inches(1.15), Inches(0.22),
                         fill_color=RGBColor(0x0A, 0x3A, 0x1A),
                         border_color=RGBColor(0x16, 0x5E, 0x36),
                         corner_radius=Inches(0.06))
        tf = badge.text_frame
        p = tf.paragraphs[0]
        p.text = "✓ REAL DATA"
        p.font.size = Pt(7)
        p.font.color.rgb = EMERALD
        p.font.bold = True
        p.font.name = 'Outfit'
        p.alignment = PP_ALIGN.CENTER

    add_text_box(slide, x + Inches(0.25), y + Inches(0.6), Inches(3.35), Inches(0.5),
                 context, Pt(9), LIGHT_GRAY, False)

    # Leads
    for j, (company, score, detail) in enumerate(leads):
        ly = y + Inches(1.3 + j * 0.75)
        lead_card = add_rect(slide, x + Inches(0.15), ly, Inches(3.55), Inches(0.65),
                             fill_color=RGBColor(0x08, 0x12, 0x22),
                             border_color=BORDER_GRAY, corner_radius=Inches(0.08))
        add_text_box(slide, x + Inches(0.3), ly + Inches(0.05), Inches(2.5), Inches(0.25),
                     company, Pt(10), WHITE, True)
        add_text_box(slide, x + Inches(0.3), ly + Inches(0.32), Inches(2.5), Inches(0.25),
                     detail, Pt(7.5), MEDIUM_GRAY, False)
        add_text_box(slide, x + Inches(2.9), ly + Inches(0.15), Inches(0.7), Inches(0.25),
                     f"{score}", Pt(10), BLUE_PRIMARY, True)

# ═══════════════════════════════════════════════════════════════
# SLIDE 10: AUTO-PILOT
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "09", "24/7 AUTONOMOUS OPERATION")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "Set It and Forget It: Auto-Pilot Mode", Pt(34), WHITE, True)

add_text_box(slide, Inches(1), Inches(2.1), Inches(11.3), Inches(0.8),
             "Turn on Auto-Pilot and TradeNexus continuously scouts for new buyers, learns which channels work best,\n"
             "and automatically reallocates search budget to high-performing applications.",
             Pt(14), LIGHT_GRAY, False)

# Auto-pilot features
ap_features = [
    ("🔄", "Automatic\nRe-Scouting", "Runs every few minutes.\nFinds fresh leads while\nyou focus on closing."),
    ("🧠", "Learning\nEngine", "Tracks which applications\nand channels convert best.\nShifts budget automatically."),
    ("🎯", "Smart\nPrioritization", "Focuses on high-demand\nregions. Skips dead ends.\nMaximizes ROI per cycle."),
    ("📱", "Background\nOperation", "Works even when you're\nlogged out. New leads\nwaiting when you return."),
    ("📊", "Performance\nAnalytics", "Per-lane conversion rates.\nSee exactly which buyer\nsegments are working."),
    ("🔔", "Fresh Lead\nAlerts", "New verified leads appear\nin your pipeline. No need\nto check manually."),
]

for i, (icon, title, desc) in enumerate(ap_features):
    col = i % 3
    row = i // 3
    x = Inches(1 + col * 3.9)
    y = Inches(3.2 + row * 2.0)

    card = add_rect(slide, x, y, Inches(3.6), Inches(1.75),
                    fill_color=RGBColor(0x0F, 0x1A, 0x2E),
                    border_color=BORDER_GRAY, corner_radius=Inches(0.12))
    add_text_box(slide, x + Inches(0.25), y + Inches(0.15), Inches(3.1), Inches(0.4),
                 f"{icon}  {title}", Pt(14), WHITE, True)
    add_text_box(slide, x + Inches(0.25), y + Inches(0.65), Inches(3.1), Inches(0.9),
                 desc, Pt(10), LIGHT_GRAY, False)

# ═══════════════════════════════════════════════════════════════
# SLIDE 11: WHY TRADENEXUS (COMPETITIVE)
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide)
add_section_header(slide, "10", "WHY TRADENEXUS")

add_text_box(slide, Inches(1), Inches(1.2), Inches(11.3), Inches(0.8),
             "What Makes TradeNexus Different", Pt(34), WHITE, True)

# Comparison table
# Headers
headers = ["", "TradeNexus AI", "Trade Shows", "B2B Databases", "Manual Research"]
col_widths = [Inches(2.8), Inches(2.6), Inches(2.6), Inches(2.6), Inches(2.6)]
col_starts = [Inches(0.7)]
for w in col_widths[:-1]:
    col_starts.append(Inches(col_starts[-1]) + w)

# Header row
for j, (header, x, w) in enumerate(zip(headers, col_starts, col_widths)):
    bg = BLUE_PRIMARY if j == 1 else DARK_GRAY
    cell = add_rect(slide, x, Inches(2.8), w - Inches(0.1), Inches(0.45), fill_color=bg)
    add_text_box(slide, x + Inches(0.1), Inches(2.82), w - Inches(0.3), Inches(0.4),
                 header, Pt(11), WHITE, True, PP_ALIGN.CENTER)

# Data rows
rows_data = [
    ("Cost Per Campaign", "Free to start", "$20K–$100K+", "$5K–$15K/year", "Hundreds of hours"),
    ("Buyer Verification", "✅ Live verified", "❌ Business cards", "⚠️ Often outdated", "❌ Self-researched"),
    ("Time to First Lead", "⏱️ ~3 minutes", "3–6 months prep", "Instant (unverified)", "Days to weeks"),
    ("Global Coverage", "190+ countries", "1–3 countries", "Limited datasets", "As much as you can"),
    ("AI Personalization", "✅ Per buyer", "❌ Generic pitch", "❌ Template only", "❌ Manual only"),
    ("Multi-Channel Search", "Google + 6 socials", "In-person only", "Email only", "Google only"),
    ("Auto-Pilot / 24/7", "✅ Yes", "❌ No", "❌ No", "❌ No"),
    ("Market Intelligence", "Full reports", "Brochures only", "Basic filters", "Self-compiled"),
]

for i, row_data in enumerate(rows_data):
    y = Inches(3.35 + i * 0.48)
    bg_color = RGBColor(0x0F, 0x1A, 0x2E) if i % 2 == 0 else RGBColor(0x08, 0x12, 0x22)

    for j, (cell_text, x, w) in enumerate(zip(row_data, col_starts, col_widths)):
        cell = add_rect(slide, x, y, w - Inches(0.1), Inches(0.42), fill_color=bg_color)

        text_color = EMERALD if "✅" in cell_text or "Free" in cell_text or "~3" in cell_text else \
                     ORANGE if "❌" in cell_text or "$20K" in cell_text or "Hundreds" in cell_text else \
                     CYAN if "⏱️" in cell_text else \
                     WHITE if j == 0 else LIGHT_GRAY

        add_text_box(slide, x + Inches(0.12), y + Inches(0.05), w - Inches(0.35), Inches(0.35),
                     cell_text, Pt(9.5), text_color, j == 0, PP_ALIGN.CENTER if j > 0 else PP_ALIGN.LEFT)

# Bottom callout
add_text_box(slide, Inches(1), Inches(7.1), Inches(11.3), Inches(0.3),
             "🏆  TradeNexus combines the best of all worlds: AI speed + human-quality verification + continuous autonomous operation.",
             Pt(10), EMERALD, False, PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════
# SLIDE 12: GET STARTED / CTA
# ═══════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_dark_background(slide, DARKER_BG)

# Decorative top bar
add_gradient_bar(slide, Inches(0), Inches(0), Inches(13.333), Inches(0.08), BLUE_PRIMARY, CYAN)

# Center content
add_text_box(slide, Inches(1), Inches(1.8), Inches(11.3), Inches(0.6),
             "Ready to Find Your Next Buyer?", Pt(42), WHITE, True, PP_ALIGN.CENTER)

add_text_box(slide, Inches(2), Inches(2.8), Inches(9.3), Inches(1.0),
             "Join manufacturers and exporters using TradeNexus AI to discover\n"
             "verified B2B leads across 190+ countries — starting today.",
             Pt(16), LIGHT_GRAY, False, PP_ALIGN.CENTER)

# CTA Button (visual)
cta_btn = add_rect(slide, Inches(4.7), Inches(4.0), Inches(4.0), Inches(0.8),
                   fill_color=BLUE_PRIMARY, corner_radius=Inches(0.15))
tf = cta_btn.text_frame
p = tf.paragraphs[0]
p.text = "Start Scouting Free  →"
p.font.size = Pt(18)
p.font.color.rgb = WHITE
p.font.bold = True
p.font.name = 'Outfit'
p.alignment = PP_ALIGN.CENTER

# Bottom stats row
add_stat_card(slide, Inches(1.5), Inches(5.4), Inches(2.4), Inches(1.0), "190+", "Countries Scouted", CYAN)
add_stat_card(slide, Inches(4.2), Inches(5.4), Inches(2.4), Inches(1.0), "3 min", "To First Lead", EMERALD)
add_stat_card(slide, Inches(6.9), Inches(5.4), Inches(2.4), Inches(1.0), "24/7", "Autonomous Operation", BLUE_PRIMARY)
add_stat_card(slide, Inches(9.6), Inches(5.4), Inches(2.4), Inches(1.0), "Free", "To Start", EMERALD)

# Bottom
add_gradient_bar(slide, Inches(0), Inches(7.42), Inches(13.333), Inches(0.08), BLUE_PRIMARY, CYAN)

add_text_box(slide, Inches(3), Inches(6.8), Inches(7.3), Inches(0.4),
             "tradenexus.ai  ·  AI-Powered B2B Prospecting Platform", Pt(10), MEDIUM_GRAY, False, PP_ALIGN.CENTER)

# ═══════════════════════════════════════════════════════════════
# SAVE
# ═══════════════════════════════════════════════════════════════
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'TradeNexus_Pitch_Deck.pptx')
prs.save(output_path)
print(f"✅ Pitch deck saved to: {output_path}")
print(f"📊 Slides: {len(prs.slides)}")
