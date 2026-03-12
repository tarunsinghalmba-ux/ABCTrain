/*
  # Seed Tier 2 & Tier 3 Training Courses

  ## Overview
  Adds caregiver core skills (Tier 2) and specialty/continuing education courses (Tier 3).

  ## 1. Data Insertions

  ### Tier 2 - Caregiver Core Skills (Required for Orientation)
  Adds 5 essential caregiver training courses:
  1. Introduction to Caregiving (3 hours)
  2. Preventing the Spread of Infection (2 hours)
  3. Safe Patient Handling (1 hour)
  4. Assisting with Activities of Daily Living (2 hours)
  5. Caring for the Disabled - Personal Care Skills (3 hours)

  ### Tier 3 - Specialty & Continuing Education (Annual CE)
  Adds 6 specialty and continuing education courses:
  1. Dementia Care and Elderly Care (3 hours)
  2. Dementia Care: Communication Strategies (1 hour)
  3. Mealtime Management and Nutrition (1 hour)
  4. Sepsis Awareness for Caregivers (30 min)
  5. Mental Health and Resiliency in Caregiving (30 min)
  6. Mental Health Wellness for IDD Individuals - 6-part series (3 hours)

  ## 2. Important Notes
  - Tier 2 courses marked as required for orientation
  - Tier 3 courses support annual CE requirements
  - Multiple free sources: Alison.com, SC Training (SafetyCulture), Texas HHS
  - All courses include compliance tags and CE hours
  - External links for certificate-eligible courses
*/

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
  'Introduction to Caregiving',
  'Comprehensive introduction to caregiving fundamentals, roles, and responsibilities. Essential orientation training for new caregivers.',
  'Caregiver Skills',
  180,
  'external_link',
  'Alison.com',
  'https://alison.com/tag/caregiving',
  '26 TAC §558 – Attendant Orientation',
  3.0,
  true,
  true
),
(
  'Preventing the Spread of Infection (Infection Control)',
  'Essential training on infection control practices, hand hygiene, PPE usage, and preventing disease transmission in caregiving settings.',
  'Caregiver Skills',
  120,
  'external_link',
  'Alison.com',
  'https://alison.com/course/caregiver-support-services-training-preventing-the-spread-of-infection',
  '26 TAC §558 – Infection Control',
  2.0,
  true,
  true
),
(
  'Safe Patient Handling (Lifting, Transferring, Repositioning)',
  'Training on proper body mechanics, safe lifting techniques, and transfer methods to prevent caregiver and client injuries.',
  'Caregiver Skills',
  60,
  'external_link',
  'SC Training (SafetyCulture)',
  'https://training.safetyculture.com/course-collection/free-online-caregiver-courses-with-certificates/',
  'Safety / ADL Assistance',
  1.0,
  true,
  true
),
(
  'Assisting with Activities of Daily Living (ADLs)',
  'Comprehensive training on assisting clients with daily personal care tasks including bathing, dressing, grooming, and toileting.',
  'Caregiver Skills',
  120,
  'external_link',
  'Alison.com',
  'https://alison.com/tag/caregiving',
  '26 TAC §558 – Personal Care Tasks',
  2.0,
  true,
  true
),
(
  'Caring for the Disabled – Personal Care Skills',
  'Specialized training on providing personal care services to individuals with disabilities, focusing on dignity and person-centered approaches.',
  'Caregiver Skills',
  180,
  'external_link',
  'Alison.com',
  'https://alison.com/tag/caregiving',
  '26 TAC §558 – Attendant Competency',
  3.0,
  true,
  true
),
(
  'Dementia Care and Elderly Care',
  'Comprehensive training on dementia care best practices, understanding cognitive decline, and providing person-centered elderly care.',
  'Continuing Education',
  180,
  'external_link',
  'Alison.com',
  'https://alison.com/course/caregiving-skills-dementia-care-and-elderly-care',
  'Annual CE – Dementia',
  3.0,
  false,
  true
),
(
  'Dementia Care: Communication Strategies',
  'Specialized training on effective communication techniques for working with individuals experiencing dementia and cognitive impairment.',
  'Continuing Education',
  60,
  'external_link',
  'SC Training (SafetyCulture)',
  'https://training.safetyculture.com/',
  'Annual CE – Communication',
  1.0,
  false,
  true
),
(
  'Mealtime Management and Nutrition',
  'Training on proper nutrition, meal planning, feeding assistance, and addressing dietary needs for clients with various conditions.',
  'Continuing Education',
  60,
  'external_link',
  'SC Training (SafetyCulture)',
  'https://training.safetyculture.com/',
  'Annual CE – Nutrition',
  1.0,
  false,
  true
),
(
  'Sepsis Awareness for Caregivers',
  'Critical training on recognizing early signs of sepsis, understanding risk factors, and taking appropriate action to prevent serious complications.',
  'Continuing Education',
  30,
  'external_link',
  'SC Training (SafetyCulture)',
  'https://training.safetyculture.com/',
  'Annual CE – Medical Awareness',
  0.5,
  false,
  true
),
(
  'Mental Health and Resiliency in Caregiving',
  'Training focused on caregiver self-care, stress management, building resilience, and preventing burnout in the caregiving profession.',
  'Continuing Education',
  30,
  'external_link',
  'SC Training (SafetyCulture)',
  'https://training.safetyculture.com/',
  'Annual CE – Self-Care',
  0.5,
  false,
  true
),
(
  'Mental Health Wellness for IDD Individuals (6-part series)',
  'Comprehensive 6-part training series on mental health support for individuals with intellectual and developmental disabilities. Covers assessment, intervention, and wellness strategies.',
  'Continuing Education',
  180,
  'external_link',
  'Texas HHS',
  'https://hhs.texas.gov/providers/provider-training/training-initiatives',
  'Annual CE – IDD Mental Health',
  3.0,
  false,
  true
)
ON CONFLICT DO NOTHING;
