---
name: Athena Intelligence
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#45464c'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  card-title:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  subheading:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  ui-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  table-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar_width: 216px
  navbar_height: 56px
  right_panel_width: 280px
  gutter: 16px
  container_padding: 24px
---

## Brand & Style
The design system is built for a high-performance interview preparation environment, characterized by extreme functional clarity and a systematic, data-driven aesthetic. The style is **Corporate / Modern**, leaning heavily into the "utility-first" philosophy found in elite developer tools and enterprise SaaS portals. 

The user interface prioritizes high information density without sacrificing legibility. It utilizes a restrained color palette to ensure that educational content and performance metrics remain the focal point. The emotional response is one of calm productivity, reliability, and academic rigor.

## Colors
The color system utilizes a white-label enterprise foundation with specific semantic accents. 
- **Primary Surface:** The interface relies on `main_bg` (#F9FAFB) for the canvas, with `card_bg` (#FFFFFF) used to elevate content containers.
- **Action & Brand:** The `primary_color` (#111827) is reserved for high-priority actions and headings, creating a grounded, authoritative feel.
- **Semantic Accents:** Status indicators (Easy/Medium/Hard) and gamification elements (XP) use high-saturation hues to provide immediate visual feedback. 
- **Navigation:** The sidebar uses a high-contrast interaction model, switching from `sidebar_inactive_text` to a vibrant `sidebar_active_text` and background to denote the current scope.

## Typography
The system exclusively uses **Inter** to maintain a systematic and neutral tone.
- **Hierarchical Contrast:** Focus is driven through weight changes (Regular to Semi-Bold) rather than extreme scale shifts.
- **Micro-copy:** Table headers and small labels use an uppercase, tracked-out style to differentiate metadata from user content.
- **Utility:** The 14px `ui-medium` is the workhorse of the system, applied to navigation items, buttons, and input fields for optimal legibility.

## Layout & Spacing
This design system utilizes a **Fixed-Component Grid** model. 
- **Structure:** A fixed 216px sidebar anchors the left, while a 280px panel (typically for leaderboard or profile stats) anchors the right on desktop views. 
- **Main Content:** The center area is fluid but maintains a maximum content width to prevent line lengths from becoming unreadable.
- **Rhythm:** An 8px base unit drives all spacing. The navbar is 56px high, providing a slim but distinct header. 
- **Responsive Behavior:** On tablet, the right panel collapses into a drawer or moves below the main content. On mobile, the sidebar transitions to a bottom-sheet or hamburger-triggered overlay.

## Elevation & Depth
Depth is expressed through **low-contrast outlines** and subtle ambient shadows. 
- **Cards:** Use a 1px border (#E5E7EB) and a very soft shadow (`0 1px 3px rgba(0,0,0,0.1)`) to separate content from the #F9FAFB background.
- **Navigation:** The navbar uses a bottom-border only, avoiding shadows to keep the top level of the UI feeling lightweight and flat.
- **Interactive Elements:** Buttons and inputs remain flat but utilize subtle color shifts (e.g., #F3F4F6 hover) on interaction rather than increasing shadow depth.

## Shapes
The shape language is **Soft** and professional. 
- **Container Radius:** Standard cards and large containers use 8px corners to provide a modern, approachable feel.
- **Component Radius:** Interactive elements like buttons, input fields, and sidebar selection states use a tighter 6px radius. This differentiation helps users distinguish between "containers" and "actions" at a glance.
- **Status Pills:** Status indicators (Easy/Medium/Hard) should use fully rounded (pill) caps to denote their status as badges rather than buttons.

## Components
- **Buttons:** Primary buttons are #111827 with white text and 6px rounding. Secondary buttons should use #FFFFFF background with a #E5E7EB border.
- **Sidebar Items:** Inactive items use #374151 text. Active items transition to #2563EB text on an #EFF6FF background. Icons should be 20px centered.
- **Cards:** Always white background with a 1px #E5E7EB border and 8px radius. Titles within cards should use the `card-title` typography style.
- **Inputs:** 6px radius, #FFFFFF background, 1px #E5E7EB border. Focus state should use a 2px #3B82F6 ring.
- **Table Headers:** Use the `table-header` style (12px Semi-Bold, Uppercase) with a subtle bottom border.
- **XP Badges:** Feature #F59E0B for coins and #F97316 for lightning bolt icons to provide high-energy visual feedback.
- **Status Tags:** Use a light background (e.g., #ECFDF5) with dark text (#059669) for "Success" or "Easy" statuses.