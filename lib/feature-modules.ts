export interface FeatureModulesDTO {
  // Праздничное оформление
  feature_holiday: boolean;

  // Интерактив
  feature_interactive: boolean;
  feature_typing: boolean;
  feature_playground: boolean;
  feature_git: boolean;

  // Учебный процесс
  feature_schedule: boolean;
  feature_attendance: boolean;
  feature_duty: boolean;
  feature_practice: boolean;
  feature_scholarship: boolean;

  // Обучение (LMS)
  feature_assignments: boolean;
  feature_materials: boolean;
  feature_tests: boolean;
  feature_subjects: boolean;
  feature_specialties: boolean;
}

export const DEFAULT_FEATURE_MODULES: FeatureModulesDTO = {
  feature_holiday: true,

  feature_interactive: true,
  feature_typing: true,
  feature_playground: true,
  feature_git: true,

  feature_schedule: true,
  feature_attendance: true,
  feature_duty: true,
  feature_practice: true,
  feature_scholarship: true,

  feature_assignments: true,
  feature_materials: true,
  feature_tests: true,
  feature_subjects: true,
  feature_specialties: true,
};

