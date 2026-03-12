/*
  # Seed HCSSA Compliance Course Catalog

  ## Overview
  Pre-loads Tier 1 HCSSA compliance courses required by Texas 26 TAC §558 regulations.

  ## 1. Data Insertions

  ### courses table
  Adds 5 required HCSSA compliance courses:
  1. HCSSA Presurvey Training - Module 1 (General Overview)
  2. HCSSA Presurvey Training - Module 2 (General Requirements)
  3. HCSSA Presurvey Training - Module 3 (PAS Standards)
  4. ANE Competency Training (Abuse, Neglect & Exploitation)
  5. Trauma-Informed Care for Direct Service Workers

  ## 2. Important Notes
  - All courses are marked as required (is_required = true)
  - All courses are active by default (is_active = true)
  - CE hours set to 1.0 or 1.5 based on duration
  - Compliance tags reference specific Texas regulations
  - External URLs point to free Texas HHS training resources
  - Delivery format: external_link (CBT courses hosted by Texas HHS)
  - Source provider: Texas HHS
*/

-- Insert HCSSA Compliance Courses (Tier 1)
INSERT INTO courses (
  title,
  description,
  category,
  estimated_duration_minutes,
  delivery_format,
  source_provider,
  external_url,
  compliance_tag,
  ce_hours,
  is_required,
  is_active
) VALUES
(
  'HCSSA Presurvey Training – Module 1: General Overview',
  'Texas Health and Human Services Computer-Based Training covering general overview of HCSSA licensing requirements. Required for administrators and alternate administrators.',
  'Compliance',
  60,
  'external_link',
  'Texas HHS',
  'https://apps.hhs.texas.gov/providers/hcssa/cbt/',
  '26 TAC §558.13 – Presurvey Training',
  1.0,
  true,
  true
),
(
  'HCSSA Presurvey Training – Module 2: General HCSSA Requirements',
  'Texas HHS CBT covering general HCSSA licensing standards and requirements. Required for administrators and alternate administrators.',
  'Compliance',
  60,
  'external_link',
  'Texas HHS',
  'https://apps.hhs.texas.gov/providers/hcssa/cbt/module2/',
  '26 TAC §558 – Licensing Standards',
  1.0,
  true,
  true
),
(
  'HCSSA Presurvey Training – Module 3: Personal Assistance Services Standards',
  'Texas HHS CBT covering PAS-specific requirements under HCSSA regulations. Required for administrators and alternate administrators.',
  'Compliance',
  60,
  'external_link',
  'Texas HHS',
  'https://apps.hhs.texas.gov/providers/hcssa/cbt/module3/',
  '26 TAC §558 Subchapter D §558.404 – PAS-Specific Requirements',
  1.0,
  true,
  true
),
(
  'ANE Competency Training (Abuse, Neglect & Exploitation)',
  'Required training on recognizing, preventing, and reporting abuse, neglect, and exploitation. Mandatory for all staff members in contact with clients.',
  'Compliance',
  60,
  'external_link',
  'Texas HHS',
  'https://hhs.texas.gov/providers/long-term-care-providers/long-term-care-provider-resources/long-term-care-provider-web-based-training',
  '26 TAC §558.250 – Reporting ANE',
  1.0,
  true,
  true
),
(
  'Trauma-Informed Care for Direct Service Workers',
  'Evidence-based training on trauma-informed care principles and person-centered care approaches for direct service workers.',
  'Compliance',
  90,
  'external_link',
  'Texas HHS',
  'https://hhs.texas.gov/providers/provider-training/training-initiatives',
  'Best Practice / Person-Centered Care',
  1.5,
  true,
  true
)
ON CONFLICT DO NOTHING;
